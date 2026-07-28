import type { Address } from 'viem';

import type { TrackKey } from './governance';

/**
 * Caches `ProposalCreated` logs in the browser. The RPC refuses `eth_getLogs` over 10M blocks (~12 days here),
 * so scans are windowed and only the new range is read. Live proposal state is never cached.
 */

export type CreatedProposal = {
  id: bigint;
  track: TrackKey;
  description: string;
  proposer: Address;
  targets: readonly Address[];
  values: readonly bigint[];
  calldatas: readonly `0x${string}`[];
  voteStart: bigint;
  voteEnd: bigint;
  blockNumber: bigint;
};

/** The endpoint allows 10M blocks; this leaves a margin for stricter nodes. */
export const MAX_LOG_SPAN = 9_000_000n;

/** Bump when the stored shape changes. */
const VERSION = 2;

const keyFor = (chainId: number) =>
  `mstrx.proposal-logs.v${VERSION}.${chainId}`;

type Stored = {
  v: number;
  scannedTo: string;
  found: {
    id: string;
    track: string;
    description: string;
    proposer: string;
    targets: string[];
    values: string[];
    calldatas: string[];
    voteStart: string;
    voteEnd: string;
    blockNumber: string;
  }[];
};

/** Inclusive windows, oldest first. Empty when there is nothing to scan. */
export const logWindows = (
  from: bigint,
  to: bigint,
  maxSpan: bigint = MAX_LOG_SPAN,
): { from: bigint; to: bigint }[] => {
  if (to < from) return [];

  const windows: { from: bigint; to: bigint }[] = [];
  for (let start = from; start <= to; start += maxSpan) {
    const end = start + maxSpan - 1n;
    windows.push({ from: start, to: end > to ? to : end });
  }
  return windows;
};

/** Scans re-read their last block, so overlaps are normal. Keyed by track and id. */
export const mergeProposals = (
  existing: readonly CreatedProposal[],
  incoming: readonly CreatedProposal[],
): CreatedProposal[] => {
  const byIdentity = new Map<string, CreatedProposal>();
  for (const proposal of [...existing, ...incoming]) {
    byIdentity.set(`${proposal.track}:${proposal.id}`, proposal);
  }
  return [...byIdentity.values()].sort((a, b) =>
    a.blockNumber === b.blockNumber
      ? Number(a.id - b.id)
      : Number(a.blockNumber - b.blockNumber),
  );
};

const serialize = (p: CreatedProposal): Stored['found'][number] => ({
  id: p.id.toString(),
  track: p.track,
  description: p.description,
  proposer: p.proposer,
  targets: [...p.targets],
  values: p.values.map(String),
  calldatas: [...p.calldatas],
  voteStart: p.voteStart.toString(),
  voteEnd: p.voteEnd.toString(),
  blockNumber: p.blockNumber.toString(),
});

const deserialize = (
  row: Stored['found'][number],
  tracks: readonly string[],
): CreatedProposal | null => {
  if (!tracks.includes(row.track)) return null;
  return {
    id: BigInt(row.id),
    track: row.track as TrackKey,
    description: row.description,
    proposer: row.proposer as Address,
    targets: row.targets as Address[],
    values: row.values.map(BigInt),
    calldatas: row.calldatas as `0x${string}`[],
    voteStart: BigInt(row.voteStart),
    voteEnd: BigInt(row.voteEnd),
    blockNumber: BigInt(row.blockNumber),
  };
};

/** Any storage problem means "nothing cached"; the cache never blocks a page. */
export const readProposalCache = (
  chainId: number,
  deployBlock: bigint,
  tracks: readonly string[],
): { scannedTo: bigint; found: CreatedProposal[] } => {
  const empty = { scannedTo: deployBlock - 1n, found: [] as CreatedProposal[] };

  try {
    const raw = localStorage.getItem(keyFor(chainId));
    if (!raw) return empty;

    const stored = JSON.parse(raw) as Stored;
    if (stored?.v !== VERSION || typeof stored.scannedTo !== 'string') {
      return empty;
    }

    const scannedTo = BigInt(stored.scannedTo);
    // Behind the deployment block: written for a previous deployment on this chain.
    if (scannedTo < deployBlock - 1n) return empty;

    const found = (Array.isArray(stored.found) ? stored.found : [])
      .map((row) => deserialize(row, tracks))
      .filter((p): p is CreatedProposal => p !== null);

    return { scannedTo, found };
  } catch {
    return empty;
  }
};

export const writeProposalCache = (
  chainId: number,
  scannedTo: bigint,
  found: readonly CreatedProposal[],
): void => {
  try {
    const stored: Stored = {
      v: VERSION,
      scannedTo: scannedTo.toString(),
      found: found.map(serialize),
    };
    localStorage.setItem(keyFor(chainId), JSON.stringify(stored));
  } catch {
    // Storage unavailable; not worth failing over.
  }
};
