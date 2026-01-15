export interface Metric {
  label: string;
  value: string;
  change?: number;
  prefix?: string;
  suffix?: string;
}

export interface BondSeriesContract {
  id: number;
  // BTC per STRAT, WAD.
  priceBtcPerStrat: bigint;
  startTime: bigint;
  endTime: bigint;
  // Seconds.
  vestingTerm: bigint;
  // STRAT, 18 decimals.
  capacityMstrat: bigint;
  filledMstrat: bigint;
  // cbBTC, 8 decimals.
  minPurchaseBtc: bigint;
  isActive: boolean;
}

export interface RedemptionPreview {
  grossBtc: bigint;
  basePenaltyBtc: bigint;
  effPenaltyBtc: bigint;
  thfBonusBtc: bigint;
  netBtc: bigint;
  timeHeldFactor: bigint;
  epoch: bigint;
  remainingRcap: bigint;
}
