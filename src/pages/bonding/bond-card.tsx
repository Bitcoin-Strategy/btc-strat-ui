import { Clock } from 'lucide-react';

import type { BondSeries } from './types';

import { cn, formatDuration, smartFormatter } from '../../lib';

/** Positive when the series is cheaper than the pool. */
export const versusPoolLabel = (pct: number | null | undefined): string => {
  if (pct === null || pct === undefined) return '—';
  return pct > 0
    ? `${pct.toFixed(2)}% cheaper`
    : `${Math.abs(pct).toFixed(2)}% dearer`;
};

function VersusMarket({ pct }: { pct: number | null }) {
  if (pct === null) {
    return (
      <span className="text-muted font-mono text-lg font-bold">
        market price unavailable
      </span>
    );
  }

  const cheaper = pct > 0;
  return (
    <span
      className={cn(
        'font-mono text-lg font-bold',
        cheaper ? 'text-green' : 'text-red',
      )}
    >
      {cheaper ? '−' : '+'}
      {Math.abs(pct).toFixed(2)}% vs market
    </span>
  );
}

export function BondCard({
  series,
  isSelected,
  onClick,
}: {
  series: BondSeries;
  isSelected: boolean;
  onClick: () => void;
}) {
  const filledPct =
    series.capacityStrat > 0
      ? (series.filledStrat / series.capacityStrat) * 100
      : 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full cursor-pointer rounded-xl border p-5 text-left transition-all',
        isSelected
          ? 'border-orange bg-orange/10'
          : 'border-border bg-card hover:border-muted',
      )}
    >
      {isSelected && (
        <div className="bg-orange absolute right-0 top-0 rounded-bl-lg rounded-tr-lg px-2 py-1 text-xs font-bold text-black">
          SELECTED
        </div>
      )}

      <div className="mb-4 flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{series.name}</span>
          <span className="text-muted text-sm">id #{series.id}</span>
          {!series.isOpen && (
            <span className="border-border text-muted rounded-full border px-2 py-0.5 text-[10px] uppercase">
              closed
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-col gap-0.5">
          <VersusMarket pct={series.discountVsMarketPct} />
          <span className="text-muted text-[10px]">
            Bonding costs {smartFormatter(series.priceBtc)} BTC per STRAT
            {series.priceUsd === null
              ? ''
              : ` · ≈ $${smartFormatter(series.priceUsd)}`}
          </span>
        </div>
      </div>

      <div className="space-y-3 border-t pt-3 text-sm">
        <div className="text-muted flex justify-between gap-3">
          <span>Vesting Term</span>
          <span className="flex items-center gap-1 text-white">
            <Clock size={14} /> {formatDuration(series.vestingTermSeconds)}
          </span>
        </div>
        <div className="text-muted flex justify-between gap-3">
          <span>Minimum Bond</span>
          <span className="text-white">
            {smartFormatter(series.minPurchaseBtc)} {series.asset}
          </span>
        </div>
        {/* Net Treasury share, which is what the contract checks against NAV. */}
        <div className="text-muted flex justify-between gap-3">
          <span>Backing added over NAV</span>
          <span className="text-white">
            {series.premiumOverNavPct === null
              ? '—'
              : `+${series.premiumOverNavPct.toFixed(2)}%`}
          </span>
        </div>
        <div className="text-muted flex justify-between gap-3">
          <span>Remaining</span>
          <span className="text-white">
            {smartFormatter(series.remainingStrat)} /{' '}
            {smartFormatter(series.capacityStrat)} STRAT
          </span>
        </div>
        <div className="bg-dark mt-2 h-1.5 w-full rounded-full">
          <div
            className="bg-orange h-1.5 rounded-full"
            style={{ width: `${Math.min(filledPct, 100)}%` }}
          />
        </div>
      </div>
    </button>
  );
}
