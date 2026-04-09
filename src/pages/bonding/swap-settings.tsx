import { Settings2 } from 'lucide-react';
import { useState } from 'react';

import {
  HIGH_SLIPPAGE_BPS,
  LOW_SLIPPAGE_BPS,
  MAX_DEADLINE_MINUTES,
  MAX_SLIPPAGE_BPS,
  MIN_DEADLINE_MINUTES,
  SLIPPAGE_PRESETS_BPS,
} from '../../hooks/use-swap-settings';
import { cn } from '../../lib/utils';

const asPercent = (bps: number) => (bps / 100).toString();

export function SwapSettings({
  slippageBps,
  onSlippageChange,
  deadlineMinutes,
  onDeadlineChange,
}: {
  slippageBps: number;
  onSlippageChange: (bps: number) => void;
  deadlineMinutes: number;
  onDeadlineChange: (minutes: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');

  const isPreset = SLIPPAGE_PRESETS_BPS.includes(
    slippageBps as (typeof SLIPPAGE_PRESETS_BPS)[number],
  );

  const commitCustom = (value: string) => {
    setCustom(value);
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onSlippageChange(Math.round(parsed * 100));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-muted flex items-center gap-1 text-xs transition-colors hover:text-white"
        aria-expanded={open}
      >
        <Settings2 size={14} />
        {asPercent(slippageBps)}% slippage
      </button>

      {open && (
        <div className="border-border bg-card absolute right-0 top-6 z-20 w-72 rounded-xl border p-4 shadow-xl">
          <div className="mb-1 text-sm font-bold text-white">
            Slippage tolerance
          </div>
          <p className="text-muted mb-3 text-[11px]">
            How far below the quote you accept. Below it the swap reverts and
            your tokens stay put.
          </p>

          <div className="flex gap-2">
            {SLIPPAGE_PRESETS_BPS.map((bps) => (
              <button
                key={bps}
                type="button"
                onClick={() => {
                  setCustom('');
                  onSlippageChange(bps);
                }}
                className={cn(
                  'flex-1 rounded-lg border px-2 py-1.5 font-mono text-xs transition-colors',
                  slippageBps === bps && !custom
                    ? 'border-orange bg-orange/10 text-orange'
                    : 'border-border text-muted hover:text-white',
                )}
              >
                {asPercent(bps)}%
              </button>
            ))}
            <div
              className={cn(
                'flex flex-1 items-center gap-1 rounded-lg border px-2 py-1.5',
                !isPreset || custom
                  ? 'border-orange bg-orange/10'
                  : 'border-border',
              )}
            >
              <input
                value={custom || (isPreset ? '' : asPercent(slippageBps))}
                onChange={(e) =>
                  commitCustom(e.target.value.replace(/[^\d.]/g, ''))
                }
                inputMode="decimal"
                placeholder="custom"
                aria-label="Custom slippage tolerance, in percent"
                className="w-full bg-transparent font-mono text-xs text-white outline-none"
              />
              <span className="text-muted text-xs">%</span>
            </div>
          </div>

          {slippageBps > HIGH_SLIPPAGE_BPS && (
            <p className="text-red mt-3 text-[11px]">
              {asPercent(slippageBps)}% is well below the quote. Only go this
              high if swaps keep failing.
            </p>
          )}
          {slippageBps < LOW_SLIPPAGE_BPS && (
            <p className="mt-3 text-[11px] text-orange-300">
              Below 0.1% most swaps revert.
            </p>
          )}

          <div className="border-border/60 mt-4 border-t pt-3">
            <div className="mb-1 text-sm font-bold text-white">Deadline</div>
            <p className="text-muted mb-2 text-[11px]">
              After this, the router refuses the swap.
            </p>
            <div className="border-border flex items-center gap-2 rounded-lg border px-2 py-1.5">
              <input
                value={deadlineMinutes}
                onChange={(e) => {
                  const parsed = Number(e.target.value.replace(/[^\d]/g, ''));
                  if (Number.isFinite(parsed) && parsed > 0) {
                    onDeadlineChange(parsed);
                  }
                }}
                inputMode="numeric"
                aria-label="Transaction deadline, in minutes"
                className="w-full bg-transparent font-mono text-xs text-white outline-none"
              />
              <span className="text-muted text-xs">minutes</span>
            </div>
            <p className="text-muted mt-1 text-[10px]">
              Between {MIN_DEADLINE_MINUTES} and {MAX_DEADLINE_MINUTES} minutes.
            </p>
          </div>

          {slippageBps >= MAX_SLIPPAGE_BPS && (
            <p className="text-red mt-2 text-[11px]">
              Capped at {asPercent(MAX_SLIPPAGE_BPS)}%.
            </p>
          )}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted mt-3 w-full text-center text-[11px] hover:text-white"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
