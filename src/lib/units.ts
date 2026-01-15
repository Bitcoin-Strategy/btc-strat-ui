/** sat: raw cbBTC (8 dp). BTC WAD: BTC scaled to 18 dp. WAD: STRAT and ratios. */
export const WAD = 10n ** 18n;
export const SAT = 10n ** 8n;
export const SAT_TO_WAD = 10n ** 10n;

export const satToBtc = (sat: bigint): number => Number(sat) / 1e8;

export const btcWadToBtc = (wad: bigint): number => Number(wad) / 1e18;

export const wadToNumber = (wad: bigint): number => Number(wad) / 1e18;

export const btcToUsd = (btc: number, btcUsd: number | null): number | null =>
  btcUsd === null ? null : btc * btcUsd;

export const stratPriceToBtc = (btcPerStratWad: bigint): number =>
  Number(btcPerStratWad) / 1e18;

// Negative when below NAV.
export const premiumBps = (
  marketWad: bigint,
  navWad: bigint,
): number | null => {
  if (navWad === 0n) return null;
  return Number(((marketWad - navWad) * 10_000n) / navWad);
};
