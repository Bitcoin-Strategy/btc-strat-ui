import type { PaymentAssetState } from '../../hooks/use-payment-assets';
import {
  cn,
  handleNumberKeyDown,
  sanitizeNumberInput,
  smartFormatter,
} from '../../lib/utils';

export function PayWith({
  assets,
  selectedId,
  onSelect,
  amount,
  onAmountChange,
  validationError,
  disabled,
}: {
  assets: PaymentAssetState[];
  selectedId: string;
  onSelect: (id: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  validationError?: string;
  disabled?: boolean;
}) {
  const selected =
    assets.find((state) => state.asset.id === selectedId) ?? assets[0];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-muted text-sm">
          {assets.length > 1
            ? 'Pay with'
            : `Pay with ${selected?.symbol ?? ''}`}
        </span>
      </div>

      {/* A single option is not a choice. */}
      {assets.length > 1 && (
        <div className="border-border bg-dark mb-3 flex gap-1 rounded-lg border p-1">
          {assets.map((state) => {
            const isSelected = state.asset.id === selected?.asset.id;
            return (
              <button
                key={state.asset.id}
                type="button"
                onClick={() => onSelect(state.asset.id)}
                disabled={disabled}
                className={cn(
                  'flex-1 rounded-md px-3 py-2 text-left transition-colors disabled:cursor-not-allowed',
                  isSelected
                    ? 'bg-orange/15 text-orange'
                    : 'text-muted hover:text-white',
                )}
              >
                <span className="block text-sm font-bold">{state.symbol}</span>
                <span className="text-muted block font-mono text-[10px]">
                  {smartFormatter(Number(state.balanceInput), 8)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="relative">
        <input
          id="deposit-amount"
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(sanitizeNumberInput(e.target.value))}
          onKeyDown={handleNumberKeyDown}
          placeholder="0.00"
          disabled={disabled}
          aria-label={`Amount in ${selected?.symbol ?? 'token'}`}
          className={cn(
            'w-full rounded-lg border p-3 pr-16 font-mono text-white transition-colors focus:outline-none',
            validationError
              ? 'border-red focus:border-red bg-red/5'
              : 'border-border bg-dark focus:border-orange',
          )}
        />
        <button
          onClick={() => onAmountChange(selected?.balanceInput ?? '0')}
          type="button"
          disabled={disabled}
          className="text-orange absolute right-3 top-3 text-xs font-bold hover:text-white disabled:cursor-not-allowed"
        >
          MAX
        </button>
      </div>

      {validationError ? (
        <div className="text-red mt-2 text-xs">{validationError}</div>
      ) : (
        <div className="text-muted mt-2 text-right text-xs">
          Balance: {smartFormatter(Number(selected?.balanceInput ?? 0), 8)}{' '}
          {selected?.symbol}
        </div>
      )}
    </div>
  );
}
