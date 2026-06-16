/**
 * `previewSale().maxSellNow` ignores pool depth, so the permitted size can revert on the NAV floor.
 * This simulates descending sizes and keeps the largest that clears.
 */

// Null if the simulated sale reverts.
export type SaleAttempt = (
  size: bigint,
) => Promise<readonly [bigint, bigint] | null>;

export type ClearingSale = {
  size: bigint;
  stratSold: bigint;
  btcOut: bigint;
  limitedByLiquidity: boolean;
};

const DESCENT_FACTOR = 8n;
const DESCENT_STEPS = 6;
const REFINE_STEPS = 6;

export const largestClearingSale = async (
  cap: bigint,
  attempt: SaleAttempt,
): Promise<ClearingSale | null> => {
  if (cap <= 0n) return null;

  const full = await attempt(cap);
  if (full) {
    return {
      size: cap,
      stratSold: full[0],
      btcOut: full[1],
      limitedByLiquidity: false,
    };
  }

  // Steps down by a factor, not by halves, to reach small sizes quickly.
  let lo = 0n;
  let hi = cap;
  let best: readonly [bigint, bigint] | null = null;
  let size = cap;

  for (let step = 0; step < DESCENT_STEPS; step += 1) {
    hi = size;
    size /= DESCENT_FACTOR;
    if (size === 0n) break;
    const result = await attempt(size);
    if (result) {
      best = result;
      lo = size;
      break;
    }
  }

  if (!best) return null;

  for (let step = 0; step < REFINE_STEPS; step += 1) {
    const mid = (lo + hi) / 2n;
    if (mid <= lo || mid >= hi) break;
    const result = await attempt(mid);
    if (result) {
      best = result;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return {
    size: lo,
    stratSold: best[0],
    btcOut: best[1],
    limitedByLiquidity: true,
  };
};

/** Recovers the caller reward from the Treasury's net. Exact unless the sale is near the NAV floor, where it pays less. */
export const rewardFromBtcOut = (
  btcOut: bigint,
  rewardBps: number,
  maxRewardBtc: bigint,
): bigint => {
  const bps = BigInt(rewardBps);
  if (bps === 0n || bps >= 10_000n) return 0n;
  const reward = (btcOut * bps) / (10_000n - bps);
  return maxRewardBtc !== 0n && reward > maxRewardBtc ? maxRewardBtc : reward;
};
