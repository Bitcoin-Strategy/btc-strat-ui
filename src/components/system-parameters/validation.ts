import { DECIMAL } from './field-logic';
import type { InputType } from './types';

type Check = { valid: boolean; error?: string };

const ok: Check = { valid: true };
const no = (error: string): Check => ({ valid: false, error });

const decimal = (value: string, what: string): Check => {
  if (!DECIMAL.test(value.trim())) return no(`Enter ${what}`);
  const num = parseFloat(value);
  if (Number.isNaN(num)) return no(`Enter ${what}`);
  if (num < 0) return no('Cannot be negative');
  return ok;
};

/** Stored as basis points. */
const percentage = (value: string): Check => {
  const hint = 'Enter a percentage, 6 means 6%';
  if (!DECIMAL.test(value.trim())) return no(hint);
  const num = parseFloat(value);
  if (Number.isNaN(num)) return no(hint);
  if (num < 0) return no('Cannot be negative');
  if (num > 100) return no('Cannot be above 100%');
  // Bps is the smallest stored step.
  if (Math.round(num * 100) !== num * 100) {
    return no('At most two decimals, 0.25 is 25 bps');
  }
  return ok;
};

const whole = (
  value: string,
  inputType: 'uint16' | 'uint32',
  unit?: string,
) => {
  if (!/^\d+$/.test(value.trim())) {
    return no(unit ? `Whole ${unit} only` : 'Whole number only');
  }
  const limit = inputType === 'uint32' ? 4_294_967_295n : 65_535n;
  return BigInt(value) > limit ? no('Too large for this field') : ok;
};

export const validateInput = (
  value: string,
  inputType: InputType,
  unit?: string,
): Check => {
  if (!value || value.trim() === '') return no('Required');

  switch (inputType) {
    case 'address':
      return /^0x[a-fA-F0-9]{40}$/.test(value)
        ? ok
        : no('Not an address: expected 0x and 40 hex characters');

    case 'uint':
      return decimal(value, unit ? `a number of ${unit}` : 'a number');

    case 'uint32':
    case 'uint16':
      return whole(value, inputType, unit);

    case 'bool':
      return value.toLowerCase() === 'true' || value.toLowerCase() === 'false'
        ? ok
        : no('Choose enable or disable');

    case 'bps':
      return percentage(value);

    case 'datetime':
      return Number.isNaN(new Date(value).getTime())
        ? no('Pick a date and time')
        : ok;

    default:
      return ok;
  }
};

/** Checks the converted value against the contract limit. */
export const checkBound = (
  sent: unknown,
  bound: bigint,
  kind: 'max' | 'min',
  formatted: string,
): string | null => {
  let value: bigint;
  try {
    value = BigInt(sent as string | number | bigint);
  } catch {
    return null;
  }
  if (kind === 'max' && value > bound) {
    return `The contract allows at most ${formatted}`;
  }
  if (kind === 'min' && value < bound) {
    return `The contract requires at least ${formatted}`;
  }
  return null;
};

export const formatInputPlaceholder = (
  inputType: InputType,
  unit?: string,
): string => {
  switch (inputType) {
    case 'address':
      return '0x…';
    case 'bps':
      return '6';
    case 'bool':
      return 'true or false';
    case 'uint':
    case 'uint32':
    case 'uint16':
      return unit ? `0 ${unit}` : '0';
    default:
      return '';
  }
};
