import { formatUnits } from 'viem';

import { DarkBox } from '../../components/ui';
import type { SwapQuote, SwapVenue } from '../../lib/swap';
import { cn, smartFormatter } from '../../lib/utils';

const IMPACT_NOTABLE_BPS = 100;
const IMPACT_SEVERE_BPS = 500;

type Tone = 'default' | 'warn' | 'bad';

const toneClass = (tone: Tone | undefined): string => {
  if (tone === 'bad') return 'text-red';
  return tone === 'warn' ? 'text-orange' : 'text-white';
};

const impactTone = (bps: number): Tone => {
  if (bps >= IMPACT_SEVERE_BPS) return 'bad';
  return bps >= IMPACT_NOTABLE_BPS ? 'warn' : 'default';
};

const Row = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: Tone;
}) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted">{label}</span>
    <span className={cn('text-right font-mono', toneClass(tone))}>{value}</span>
  </div>
);

// Fee and price impact are shown separately.
export function RouteSummary({
  quote,
  venue,
  symbolIn,
  symbolOut,
  decimalsIn,
  decimalsOut,
  slippageBps,
  isStale,
}: {
  quote: SwapQuote;
  venue: SwapVenue;
  symbolIn: string;
  symbolOut: string;
  decimalsIn: number;
  decimalsOut: number;
  slippageBps: number;
  isStale: boolean;
}) {
  const impact = quote.priceImpactBps;
  const tone = impactTone(impact);
  const rate = quote.executionRate > 0 ? 1 / quote.executionRate : 0;

  return (
    <DarkBox className="space-y-2 text-xs">
      <Row
        label="Rate"
        value={`${smartFormatter(rate, 2)} ${symbolIn} / ${symbolOut}`}
      />
      <Row
        label={`Fee · ${venue.label} ${quote.feeBps / 100}%`}
        value={`${smartFormatter(Number(formatUnits(quote.feeAmountIn, decimalsIn)), 4)} ${symbolIn}`}
      />
      <Row
        label="Price impact"
        value={`${(impact / 100).toFixed(2)}%`}
        tone={tone}
      />
      <Row
        label={`Minimum at ${(slippageBps / 100).toFixed(2)}% slippage`}
        value={`${smartFormatter(Number(formatUnits(quote.minAmountOut, decimalsOut)), 8)} ${symbolOut}`}
      />

      {impact >= IMPACT_NOTABLE_BPS && (
        <p
          className={cn(
            'text-[11px]',
            tone === 'bad' ? 'text-red' : 'text-orange',
          )}
        >
          Large for this pool. Smaller bonds cost less.
        </p>
      )}

      {isStale && <p className="text-muted text-[10px]">Refreshing…</p>}
    </DarkBox>
  );
}
