import { useQuery } from '@tanstack/react-query';
import { keccak256, stringToHex, type Address, type PublicClient } from 'viem';
import { usePublicClient } from 'wagmi';

import { GOVERNOR_ABI } from '../lib/abi/governor';
import { DEPLOY_BLOCK } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';
import {
  TRACKS,
  proposalBody,
  proposalTitle,
  stateName,
  tallyOf,
  type ProposalState,
  type TrackKey,
  type Votes,
} from '../lib/governance';
import {
  logWindows,
  mergeProposals,
  readProposalCache,
  writeProposalCache,
  type CreatedProposal,
} from '../lib/governance-log-cache';
import { REFRESH, STALE } from '../lib/refresh';

export type Proposal = CreatedProposal & {
  governor: Address;
  title: string;
  body: string;
  descriptionHash: `0x${string}`;
  state: ProposalState;
  votes: Votes;
  quorum: bigint;
  majorityBps: bigint;
  /** Read from the governor: late quorum can push the deadline past the logged `voteEnd`. */
  voteEndsAt: bigint;
  /** Zero until queued. */
  etaSeconds: bigint;
} & ReturnType<typeof tallyOf>;

const SCAN_CONCURRENCY = 8;

const scanTrack = async (
  client: PublicClient,
  track: (typeof TRACKS)[number],
  from: bigint,
  to: bigint,
): Promise<CreatedProposal[]> => {
  const windows = logWindows(from, to);
  const found: CreatedProposal[] = [];

  for (let i = 0; i < windows.length; i += SCAN_CONCURRENCY) {
    const wave = windows.slice(i, i + SCAN_CONCURRENCY);
    const batches = await Promise.all(
      wave.map((window) =>
        client.getContractEvents({
          address: track.address,
          abi: GOVERNOR_ABI,
          eventName: 'ProposalCreated',
          fromBlock: window.from,
          toBlock: window.to,
        }),
      ),
    );

    for (const logs of batches) {
      for (const log of logs) {
        found.push({
          id: log.args.proposalId as bigint,
          track: track.key,
          description: (log.args.description as string) ?? '',
          proposer: log.args.proposer as Address,
          targets: (log.args.targets ?? []) as readonly Address[],
          values: (log.args.values ?? []) as readonly bigint[],
          calldatas: (log.args.calldatas ?? []) as readonly `0x${string}`[],
          voteStart: (log.args.voteStart as bigint) ?? 0n,
          voteEnd: (log.args.voteEnd as bigint) ?? 0n,
          blockNumber: log.blockNumber ?? 0n,
        });
      }
    }
  }

  return found;
};

/** Proposal ids from logs, cached in the browser and read forward from the last cursor. */
const useProposalLogs = () => {
  const client = usePublicClient({ chainId: PROTOCOL_CHAIN.id });
  const trackKeys = TRACKS.map((track) => track.key);

  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  return useQuery({
    queryKey: ['proposal-logs', PROTOCOL_CHAIN.id],
    enabled: !!client,
    refetchInterval: REFRESH.slow,
    staleTime: STALE.slow,
    queryFn: async (): Promise<CreatedProposal[]> => {
      if (!client) return [];

      const cached = readProposalCache(
        PROTOCOL_CHAIN.id,
        DEPLOY_BLOCK,
        trackKeys,
      );
      const latest = await client.getBlockNumber();

      // Re-read the last block: it can hold more than one proposal.
      const from =
        cached.scannedTo < DEPLOY_BLOCK ? DEPLOY_BLOCK : cached.scannedTo;

      const perTrack = await Promise.all(
        TRACKS.map((track) =>
          scanTrack(client as PublicClient, track, from, latest),
        ),
      );

      const found = mergeProposals(cached.found, perTrack.flat());
      writeProposalCache(PROTOCOL_CHAIN.id, latest, found);
      return found;
    },
  });
};

/** State, tally and deadlines are read live in one multicall and never cached. */
export const useProposals = () => {
  const client = usePublicClient({ chainId: PROTOCOL_CHAIN.id });
  const {
    data: created,
    isLoading: isScanning,
    error: scanError,
    refetch: refetchLogs,
  } = useProposalLogs();

  const ids = (created ?? []).map((p) => `${p.track}:${p.id}`).join(',');

  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  const liveQuery = useQuery({
    queryKey: ['proposal-state', PROTOCOL_CHAIN.id, ids],
    enabled: !!client && created !== undefined,
    refetchInterval: REFRESH.slow,
    staleTime: STALE.slow,
    queryFn: async (): Promise<Proposal[]> => {
      if (!client || !created || created.length === 0) return [];

      // Track reads first, so their offsets do not depend on the proposal count.
      const trackReads = TRACKS.flatMap((track) => [
        {
          address: track.address,
          abi: GOVERNOR_ABI,
          functionName: 'quorumVotes' as const,
        },
        {
          address: track.address,
          abi: GOVERNOR_ABI,
          functionName: 'MAJORITY_BPS' as const,
        },
      ]);

      const proposalReads = created.flatMap((proposal) => {
        const governor = TRACKS.find((t) => t.key === proposal.track)!.address;
        const base = { address: governor, abi: GOVERNOR_ABI } as const;
        return [
          { ...base, functionName: 'state' as const, args: [proposal.id] },
          {
            ...base,
            functionName: 'proposalVotes' as const,
            args: [proposal.id],
          },
          {
            ...base,
            functionName: 'proposalDeadline' as const,
            args: [proposal.id],
          },
          {
            ...base,
            functionName: 'proposalEta' as const,
            args: [proposal.id],
          },
        ];
      });

      const results = await client.multicall({
        contracts: [...trackReads, ...proposalReads],
        allowFailure: true,
      });

      // No defaults: a guessed quorum or majority would show wrong results. Failures surface as an error.
      const trackConfig = new Map<
        TrackKey,
        { quorum: bigint; majority: bigint }
      >();
      TRACKS.forEach((track, i) => {
        const quorum = results[i * 2];
        const majority = results[i * 2 + 1];
        if (quorum?.status !== 'success' || majority?.status !== 'success') {
          throw new Error(
            `Could not read what the ${track.label.toLowerCase()} track requires`,
          );
        }
        trackConfig.set(track.key, {
          quorum: quorum.result as bigint,
          majority: majority.result as bigint,
        });
      });

      const offset = trackReads.length;
      const proposals: Proposal[] = [];

      created.forEach((proposal, i) => {
        const stateResult = results[offset + i * 4];
        const votesResult = results[offset + i * 4 + 1];
        const deadlineResult = results[offset + i * 4 + 2];
        const etaResult = results[offset + i * 4 + 3];

        // `GovernorNonexistentProposal` means a cache from an older deployment; dropping it heals the cache.
        if (stateResult?.status !== 'success') return;

        const [against, forVotes, abstain] =
          votesResult?.status === 'success'
            ? (votesResult.result as readonly [bigint, bigint, bigint])
            : ([0n, 0n, 0n] as const);

        const votes: Votes = {
          forVotes,
          againstVotes: against,
          abstainVotes: abstain,
        };

        const config = trackConfig.get(proposal.track)!;
        const governor = TRACKS.find((t) => t.key === proposal.track)!.address;

        proposals.push({
          ...proposal,
          governor,
          title: proposalTitle(proposal.description),
          body: proposalBody(proposal.description),
          // `stringToHex`, not `toBytes`: a hex-looking title would otherwise be decoded as bytes.
          descriptionHash: keccak256(stringToHex(proposal.description)),
          state: stateName(Number(stateResult.result)),
          votes,
          quorum: config.quorum,
          majorityBps: config.majority,
          voteEndsAt:
            deadlineResult?.status === 'success'
              ? (deadlineResult.result as bigint)
              : proposal.voteEnd,
          etaSeconds:
            etaResult?.status === 'success' ? (etaResult.result as bigint) : 0n,
          ...tallyOf(votes, config.quorum, config.majority),
        });
      });

      return proposals.sort((a, b) => Number(b.voteStart - a.voteStart));
    },
  });

  const {
    data: live,
    isLoading: isReadingState,
    error: stateError,
    refetch: refetchState,
  } = liveQuery;

  const refetch = async () => {
    await refetchLogs();
    await refetchState();
  };

  return {
    proposals: live ?? [],
    // Refreshing an existing list is not a loading state.
    isLoading: (isScanning || isReadingState) && live === undefined,
    error: scanError ?? stateError ?? null,
    refetch,
  };
};
