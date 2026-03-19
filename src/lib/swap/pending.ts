import type { Address, Hash } from 'viem';

/** The swapped cbBTC awaiting its bond, persisted so a closed tab can resume the route. */

const KEY = 'mstrx_pending_bond_swap';

export type PendingBondSwap = {
  chainId: number;
  account: Address;
  seriesId: string;
  amountRaw: string;
  swapHash: Hash;
  at: number;
};

const storageKey = (chainId: number, account: Address) =>
  `${KEY}:${chainId}:${account.toLowerCase()}`;

export const loadPendingSwap = (
  chainId: number | undefined,
  account: Address | undefined,
): PendingBondSwap | null => {
  if (!chainId || !account) return null;
  try {
    const raw = localStorage.getItem(storageKey(chainId, account));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingBondSwap;
    // Ignore records from older builds or hand edits.
    return parsed.amountRaw && parsed.swapHash ? parsed : null;
  } catch {
    return null;
  }
};

export const savePendingSwap = (swap: PendingBondSwap): void => {
  try {
    localStorage.setItem(
      storageKey(swap.chainId, swap.account),
      JSON.stringify(swap),
    );
  } catch {
    // Storage unavailable; not worth failing over.
  }
};

export const clearPendingSwap = (
  chainId: number | undefined,
  account: Address | undefined,
): void => {
  if (!chainId || !account) return;
  try {
    localStorage.removeItem(storageKey(chainId, account));
  } catch {
    // Storage unavailable; not worth failing over.
  }
};
