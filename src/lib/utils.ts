import { clsx, type ClassValue } from 'clsx';
import type React from 'react';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handleNumberKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
    e.preventDefault();
  }
}

export function sanitizeNumberInput(value: string): string {
  if (value === '') return '';

  const sanitized = value.replace(/[^\d.]/g, '');

  const parts = sanitized.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }

  return sanitized;
}

export const formatter = Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatUsd = (value: number): string => {
  if (value === 0) return '0.00';
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(2);
};

export const formatBtc = (value: number): string => {
  if (value === 0) return '0.00000000';
  return value.toFixed(8);
};

export const formatPrice = (value: number): string => {
  if (value === 0) return '0.00';
  if (Math.abs(value) < 0.01) {
    return value.toFixed(6);
  }
  return value.toFixed(2);
};

export const formatPercent = (value: number): string => {
  if (value === 0) return '0.00';
  return value.toFixed(2);
};

/** A missing USD value is null, shown as a dash rather than "$0.00". */
export const smartFormatter = (
  value: number | null | undefined,
  decimals: number = 8,
): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (value === 0) return '0.00';

  if (Math.abs(value) < 0.01) {
    const fixed = value.toFixed(decimals);
    let result = fixed;
    while (result.endsWith('0') && result.includes('.')) {
      result = result.slice(0, -1);
    }
    if (result.endsWith('.')) {
      result = result.slice(0, -1);
    }
    return result;
  }

  return formatter.format(value);
};

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';

  const units: [number, string][] = [
    [30 * 24 * 3600, 'month'],
    [24 * 3600, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];

  for (const [size, name] of units) {
    if (seconds >= size) {
      const count = Math.round((seconds / size) * 10) / 10;
      return `${count} ${name}${count === 1 ? '' : 's'}`;
    }
  }
  return `${Math.round(seconds)} seconds`;
};

/** Takes the bigint: tallies can exceed double precision. */
export const formatVotes = (wad: bigint): string => {
  const whole = wad / 10n ** 18n;

  if (whole >= 1_000_000n) {
    return `${(Number(wad / 10n ** 14n) / 10_000 / 1_000_000).toFixed(2)}M`;
  }
  if (whole >= 1_000n) {
    return `${(Number(wad / 10n ** 14n) / 10_000 / 1_000).toFixed(1)}k`;
  }
  return (Number(wad / 10n ** 14n) / 10_000).toFixed(2);
};
