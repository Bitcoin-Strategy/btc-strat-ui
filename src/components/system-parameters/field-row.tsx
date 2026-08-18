import { AlertCircle } from 'lucide-react';
import { useId } from 'react';

import type { InputType } from './types';

import { Input, Switch } from '../ui';

interface FieldRowProps {
  label: string;
  description?: string;
  inputType: InputType;
  unit?: string;
  placeholder?: string;
  /** Omitted for a write-only field. */
  current?: string;
  preview?: string;
  boundLabel?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  editable?: boolean;
  selectOptions?: Array<{ label: string; value: string }>;
}

export function FieldRow({
  label,
  description,
  inputType,
  unit,
  placeholder,
  current,
  preview,
  boundLabel,
  value,
  onChange,
  error,
  disabled = false,
  editable = true,
  selectOptions,
}: FieldRowProps) {
  // A radio group has no single control, so the group gets the name.
  const id = useId();
  const invalid = Boolean(error);
  const unitPadding = unit ? 'pr-14' : '';

  const control = () => {
    if (inputType === 'select' && selectOptions) {
      return (
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={`border-border bg-card text-text focus:border-orange focus:ring-orange w-full rounded-md border px-3 py-2 font-mono text-sm outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${
            invalid ? 'border-red' : ''
          }`}
        >
          <option value="">Choose one</option>
          {selectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (inputType === 'checkbox') {
      return (
        <div className="flex items-center gap-2">
          <Switch
            id={id}
            checked={value === 'true'}
            onCheckedChange={(checked) => onChange(String(checked))}
            disabled={disabled}
          />
          <span className="text-muted text-sm">
            {value === 'true' ? 'Open' : 'Closed'}
          </span>
        </div>
      );
    }

    if (inputType === 'bool') {
      return (
        <div
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          className="flex items-center gap-4"
        >
          {[
            { v: 'true', text: 'Enable' },
            { v: 'false', text: 'Disable' },
          ].map((option) => (
            <label
              key={option.v}
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                type="radio"
                name={label}
                value={option.v}
                checked={value === option.v}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                className="text-orange focus:ring-orange h-4 w-4 focus:ring-2"
              />
              <span className="text-sm text-white">{option.text}</span>
            </label>
          ))}
        </div>
      );
    }

    return (
      <div className="relative">
        <Input
          id={id}
          type={inputType === 'datetime' ? 'datetime-local' : 'text'}
          inputMode={
            inputType === 'address' || inputType === 'datetime'
              ? undefined
              : 'decimal'
          }
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={invalid}
          className={`font-mono ${unitPadding} ${invalid ? 'border-red' : ''}`}
        />
        {unit && (
          <span className="text-muted pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs">
            {unit}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-w-0 space-y-2">
      <div>
        <label
          id={`${id}-label`}
          htmlFor={inputType === 'bool' ? undefined : id}
          className="text-sm font-medium text-white"
        >
          {label}
        </label>
        {description && (
          <p className="text-muted mt-0.5 text-xs [overflow-wrap:anywhere]">
            {description}
          </p>
        )}
      </div>

      {current !== undefined && (
        <div className="flex items-baseline gap-2">
          <span className="text-muted shrink-0 text-[10px] uppercase tracking-wide">
            now
          </span>
          <span className="min-w-0 font-mono text-sm text-white [overflow-wrap:anywhere]">
            {current}
          </span>
        </div>
      )}

      {editable && (
        <>
          {control()}

          {(preview || boundLabel) && !error && (
            <div className="text-muted space-y-0.5 text-xs [overflow-wrap:anywhere]">
              {preview && (
                <div>
                  Writes <span className="text-white">{preview}</span>
                </div>
              )}
              {boundLabel && <div>{boundLabel}</div>}
            </div>
          )}

          {error && (
            <div className="text-red flex items-start gap-1.5 text-xs">
              <AlertCircle size={13} className="mt-px shrink-0" />
              <span className="[overflow-wrap:anywhere]">{error}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
