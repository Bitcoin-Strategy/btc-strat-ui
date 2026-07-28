import { useAccount, useReadContracts } from 'wagmi';

import { GOVERNOR_ABI } from '../lib/abi/governor';
import { TIMELOCK_ABI } from '../lib/abi/timelock';
import { PROTOCOL_CHAIN } from '../lib/chains';
import { TRACKS, type TrackKey } from '../lib/governance';
import { REFRESH, STALE } from '../lib/refresh';

export type TrackConfig = {
  key: TrackKey;
  label: string;
  blurb: string;
  governor: `0x${string}`;
  timelock: `0x${string}`;

  /** 18-decimal weight. */
  quorum: bigint;
  /** Bps of decisive votes; 5001 is a simple majority. */
  majorityBps: bigint;
  /** 18-decimal weight. */
  threshold: bigint;

  votingDelay: bigint;
  votingPeriod: bigint;
  /** Zero when not configured. */
  lateQuorumExtension: bigint;
  timelockDelay: bigint;

  /** Weight lookback in seconds. Long on the upgrade track, so current weight is not what counts there. */
  voteLookback: bigint;
};

const GOVERNOR_READS = [
  'quorumVotes',
  'MAJORITY_BPS',
  'proposalThreshold',
  'votingDelay',
  'votingPeriod',
  'lateQuorumVoteExtension',
  'VOTE_LOOKBACK',
] as const;

const asOptionalBigInt = (
  result: { status: string; result?: unknown } | undefined,
): bigint | undefined =>
  result?.status === 'success' ? BigInt(result.result as bigint) : undefined;

const asBigInt = (
  result: { status: string; result?: unknown } | undefined,
  fallback: bigint,
): bigint =>
  result?.status === 'success' ? BigInt(result.result as bigint) : fallback;

/** Track requirements and the wallet's weight, read from each governor (`getVotes` applies `VOTE_LOOKBACK`). */
export const useGovernanceConfig = () => {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      ...TRACKS.flatMap((track) =>
        GOVERNOR_READS.map((functionName) => ({
          chainId: PROTOCOL_CHAIN.id,
          address: track.address,
          abi: GOVERNOR_ABI,
          functionName,
        })),
      ),
      ...TRACKS.map((track) => ({
        chainId: PROTOCOL_CHAIN.id,
        address: track.timelock,
        abi: TIMELOCK_ABI,
        functionName: 'getMinDelay',
      })),
      // Governor clock, so the weight read is never in the chain's future.
      {
        chainId: PROTOCOL_CHAIN.id,
        address: TRACKS[0].address,
        abi: GOVERNOR_ABI,
        functionName: 'clock',
      },
    ],
    query: { refetchInterval: REFRESH.slow, staleTime: STALE.slow },
  });

  const perTrack = GOVERNOR_READS.length;
  const timelockOffset = TRACKS.length * perTrack;
  const clockOffset = timelockOffset + TRACKS.length;
  const clock = data?.[clockOffset];
  const now = clock?.status === 'success' ? BigInt(clock.result as number) : 0n;

  const tracks: TrackConfig[] = TRACKS.map((track, i) => {
    const at = (name: (typeof GOVERNOR_READS)[number], fallback: bigint) =>
      asBigInt(data?.[i * perTrack + GOVERNOR_READS.indexOf(name)], fallback);

    return {
      key: track.key,
      label: track.label,
      blurb: track.blurb,
      governor: track.address,
      timelock: track.timelock,
      quorum: at('quorumVotes', 0n),
      // The constructor rejects anything at or below half.
      majorityBps: at('MAJORITY_BPS', 5001n),
      threshold: at('proposalThreshold', 0n),
      votingDelay: at('votingDelay', 0n),
      votingPeriod: at('votingPeriod', 0n),
      lateQuorumExtension: at('lateQuorumVoteExtension', 0n),
      voteLookback: at('VOTE_LOOKBACK', 0n),
      timelockDelay: asBigInt(data?.[timelockOffset + i], 0n),
    };
  });

  // Loosely typed: inferring `getVotes` for both tracks exhausts the type checker.
  const { data: weights } = useReadContracts({
    contracts: TRACKS.map((track) => ({
      chainId: PROTOCOL_CHAIN.id,
      address: track.address,
      abi: GOVERNOR_ABI,
      functionName: 'getVotes',
      args: address && now > 0n ? [address, now - 1n] : undefined,
    })) as unknown as readonly {
      chainId: number;
      address: `0x${string}`;
      abi: typeof GOVERNOR_ABI;
      functionName: 'getVotes';
    }[],
    query: {
      enabled: !!address && now > 0n,
      refetchInterval: REFRESH.slow,
      staleTime: STALE.slow,
    },
  });

  const votesByTrack = new Map<TrackKey, bigint | undefined>(
    TRACKS.map((track, i) => [track.key, asOptionalBigInt(weights?.[i])]),
  );

  return {
    tracks,
    /** Zero until the first read. */
    chainNow: now,
    /** Undefined until read. */
    votesOn: (key: TrackKey) => votesByTrack.get(key),
    configOf: (key: TrackKey) =>
      tracks.find((track) => track.key === key) ?? tracks[0],
    isLoading,
    error: error ?? null,
    refetch,
  };
};
