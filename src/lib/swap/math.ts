import type { SwapQuote } from './types';

/** Price impact is reported without the pool fee. Slippage only sets `minAmountOut`. */

export const Q96 = 2n ** 96n;

const BPS = 10_000;
// Hundredths of a bip: 500 is 0.05%.
const PIPS = 1_000_000;

// Raw currency1 per raw currency0.
export const rawPriceFromSqrt = (sqrtPriceX96: bigint): number => {
  const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
  return sqrtPrice * sqrtPrice;
};

const decimalRate = (
  rawRate: number,
  decimalsIn: number,
  decimalsOut: number,
): number => rawRate * 10 ** (decimalsIn - decimalsOut);

export type BuildQuoteParams = {
  amountIn: bigint;
  amountOut: bigint;
  sqrtPriceX96: bigint;
  feePips: number;
  zeroForOne: boolean;
  slippageBps: number;
  decimalsIn: number;
  decimalsOut: number;
};

export const buildQuote = ({
  amountIn,
  amountOut,
  sqrtPriceX96,
  feePips,
  zeroForOne,
  slippageBps,
  decimalsIn,
  decimalsOut,
}: BuildQuoteParams): SwapQuote => {
  const feeFraction = feePips / PIPS;

  const spot = rawPriceFromSqrt(sqrtPriceX96);
  const spotRawRate = zeroForOne ? spot : 1 / spot;

  const inAfterFee = Number(amountIn) * (1 - feeFraction);
  const expectedRawOut = inAfterFee * spotRawRate;
  const impact =
    expectedRawOut > 0 ? 1 - Number(amountOut) / expectedRawOut : 0;

  const rawExecuted = Number(amountOut) / Number(amountIn);

  return {
    amountIn,
    amountOut,
    minAmountOut: (amountOut * BigInt(BPS - slippageBps)) / BigInt(BPS),
    zeroForOne,
    midRate: decimalRate(spotRawRate, decimalsIn, decimalsOut),
    executionRate: decimalRate(rawExecuted, decimalsIn, decimalsOut),
    priceImpactBps: Math.max(0, impact * BPS),
    feeBps: feePips / 100,
    feeAmountIn: (amountIn * BigInt(feePips)) / BigInt(PIPS),
  };
};
