/** Market comparisons are live and null while the oracle has no price. */
export interface BondSeries {
  id: string;
  name: string;

  priceBtc: number;
  priceUsd: number | null;

  // Positive means bonding is cheaper than buying.
  discountVsMarketPct: number | null;
  // Premium over NAV; always positive since the contract refuses series at or below NAV.
  premiumOverNavPct: number | null;

  // Seconds.
  vestingTermSeconds: number;

  // STRAT.
  capacityStrat: number;
  filledStrat: number;
  remainingStrat: number;

  minPurchaseBtc: number;

  // Raw units for validation; floats like 1e-7 cannot be parsed back.
  minPurchaseRaw: bigint;
  remainingStratRaw: bigint;

  // Unix seconds.
  startsAt: number;
  endsAt: number;
  // Mirrors the checks `bond()` makes.
  isOpen: boolean;

  asset: string;
  decimals: number;
  quoteAsset: `0x${string}`;
}
