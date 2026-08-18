import type { FieldPresentation, InputType } from './types';

/** Decimal input. The fraction can only start at the dot, which avoids catastrophic backtracking. */
export const DECIMAL = /^(\d+(\.\d*)?|\.\d+)$/;

/** Percent to bps on the digits: `parseFloat(v) * 100` turns 0.29 into 28 bps. */
export const percentToBps = (value: string): number => {
  const [whole, fraction = ''] = value.trim().split('.');
  const hundredths = `${fraction}00`.slice(0, 2);
  return Number(`${whole || '0'}${hundredths}`);
};

export const bpsToPercent = (bps: number | bigint): string => {
  const value = Number(bps) / 100;
  return `${Number.isInteger(value) ? value : value.toFixed(2).replace(/0$/, '')}%`;
};

export const toContractValue = (
  value: string,
  inputType: InputType,
  writeTransform?: (value: string, all?: Record<string, string>) => any,
  allValues?: Record<string, string>,
): any => {
  if (writeTransform) return writeTransform(value, allValues);

  switch (inputType) {
    case 'address':
    case 'select':
      return value as `0x${string}`;
    case 'bool':
    case 'checkbox':
      return value === 'true';
    case 'bps':
      return percentToBps(value);
    case 'datetime':
      return BigInt(Math.floor(new Date(value).getTime() / 1000));
    case 'uint':
      return BigInt(value);
    case 'uint32':
    case 'uint16':
      return parseInt(value, 10);
    default:
      return value;
  }
};

export const formatContractValue = (
  value: any,
  inputType: InputType,
  transform?: (value: any) => string,
): string => {
  if (value === undefined || value === null) return '—';
  if (transform) return transform(value);

  switch (inputType) {
    case 'bool':
    case 'checkbox':
      return value ? 'yes' : 'no';
    case 'bps':
      return bpsToPercent(value as number);
    case 'datetime': {
      const date = new Date(Number(value) * 1000);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate(),
      )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
    default:
      return String(value);
  }
};

/** Undefined when the value cannot be converted; the validator reports why. */
export const previewOf = (
  value: string,
  inputType: InputType,
  field: FieldPresentation & {
    readTransform?: (value: any) => string;
    writeTransform?: (value: string, all?: Record<string, string>) => any;
  },
  allValues?: Record<string, string>,
): string | undefined => {
  if (!value || value.trim() === '') return undefined;
  try {
    const sent = toContractValue(
      value,
      inputType,
      field.writeTransform,
      allValues,
    );
    return formatContractValue(
      sent,
      inputType,
      field.preview ?? field.readTransform,
    );
  } catch {
    return undefined;
  }
};
