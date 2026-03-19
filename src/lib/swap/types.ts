export type PoolKey = {
  readonly currency0: `0x${string}`;
  readonly currency1: `0x${string}`;
  readonly fee: number;
  readonly tickSpacing: number;
  readonly hooks: `0x${string}`;
};

/** Whether the router's `ExactInputSingleParams` has `sqrtPriceLimitX96`; verified per venue by `check-swap-venue.ts`. */
export type V4ActionLayout = 'with-price-limit' | 'without-price-limit';

export type SwapVenue = {
  readonly kind: 'uniswap-v4';
  readonly label: string;
  readonly router: `0x${string}`;
  readonly permit2: `0x${string}`;
  readonly quoter: `0x${string}`;
  readonly stateView: `0x${string}`;
  readonly poolId: `0x${string}`;
  readonly poolKey: PoolKey;
  readonly actionLayout: V4ActionLayout;
};

export type BondPaymentRoute =
  | { readonly kind: 'direct' }
  | {
      readonly kind: 'swap';
      readonly venue: SwapVenue;
      readonly to: `0x${string}`;
    };

export type BondPaymentAsset = {
  readonly id: string;
  readonly address: `0x${string}`;
  readonly symbol: string;
  readonly decimals: number;
  readonly route: BondPaymentRoute;
};

/** Raw units. `minAmountOut` is the swap floor and what every later check uses. */
export type SwapQuote = {
  readonly amountIn: bigint;
  readonly amountOut: bigint;
  readonly minAmountOut: bigint;
  readonly zeroForOne: boolean;

  readonly midRate: number;
  readonly executionRate: number;
  // Bps, excluding the pool fee.
  readonly priceImpactBps: number;
  readonly feeBps: number;
  readonly feeAmountIn: bigint;
};
