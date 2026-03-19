import { useCallback, useState } from 'react';

/** Persisted swap settings: tolerance becomes `amountOutMinimum`, deadline is enforced by the router. */

const SLIPPAGE_KEY = 'mstrx_swap_slippage_bps';
const DEADLINE_KEY = 'mstrx_swap_deadline_minutes';

export const DEFAULT_SLIPPAGE_BPS = 50;

// Below this, quote rounding alone can trip the minimum.
export const MIN_SLIPPAGE_BPS = 1;
export const MAX_SLIPPAGE_BPS = 5_000;

export const SLIPPAGE_PRESETS_BPS = [10, 50, 100] as const;

export const HIGH_SLIPPAGE_BPS = 300;
export const LOW_SLIPPAGE_BPS = 10;

export const DEFAULT_DEADLINE_MINUTES = 20;
export const MIN_DEADLINE_MINUTES = 1;
export const MAX_DEADLINE_MINUTES = 60 * 6;

const readNumber = (
  key: string,
  fallback: number,
  min: number,
  max: number,
): number => {
  try {
    const stored = Number(localStorage.getItem(key));
    if (!Number.isFinite(stored) || stored <= 0) return fallback;
    return Math.min(Math.max(Math.round(stored), min), max);
  } catch {
    return fallback;
  }
};

const write = (key: string, value: number) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage unavailable; not worth failing over.
  }
};

export const useSwapSettings = () => {
  // Storage reads never throw, so blocked storage just means defaults.
  const [slippageBps, setSlippage] = useState(() =>
    readNumber(
      SLIPPAGE_KEY,
      DEFAULT_SLIPPAGE_BPS,
      MIN_SLIPPAGE_BPS,
      MAX_SLIPPAGE_BPS,
    ),
  );
  const [deadlineMinutes, setDeadline] = useState(() =>
    readNumber(
      DEADLINE_KEY,
      DEFAULT_DEADLINE_MINUTES,
      MIN_DEADLINE_MINUTES,
      MAX_DEADLINE_MINUTES,
    ),
  );

  const setSlippageBps = useCallback((next: number) => {
    const clamped = Math.min(
      Math.max(Math.round(next), MIN_SLIPPAGE_BPS),
      MAX_SLIPPAGE_BPS,
    );
    setSlippage(clamped);
    write(SLIPPAGE_KEY, clamped);
  }, []);

  const setDeadlineMinutes = useCallback((next: number) => {
    const clamped = Math.min(
      Math.max(Math.round(next), MIN_DEADLINE_MINUTES),
      MAX_DEADLINE_MINUTES,
    );
    setDeadline(clamped);
    write(DEADLINE_KEY, clamped);
  }, []);

  return { slippageBps, setSlippageBps, deadlineMinutes, setDeadlineMinutes };
};
