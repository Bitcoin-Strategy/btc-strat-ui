/** Shared polling intervals: every read goes through one rate-limited public RPC. */
export const REFRESH = {
  /** Prices, balances, pool state. */
  live: 120_000,

  /** Changed only by governance, admin calls or the user's own transactions. */
  slow: 300_000,

  /** Changes once, e.g. pool opened or Genesis finalized. */
  never: false,
} as const;

/** Just under the interval, so a tick is never served from cache. */
export const STALE = {
  live: 90_000,
  slow: 240_000,
  never: Infinity,
} as const;
