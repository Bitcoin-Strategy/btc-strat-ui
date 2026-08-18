import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useId, useEffect, useMemo, useRef, useState } from 'react';
import type { Abi } from 'viem';
import {
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { DECIMAL, bpsToPercent, percentToBps } from './field-logic';

import { Button, Input } from '../../components/ui';
import { useEnsureProtocolChain } from '../../hooks/use-ensure-chain';
import { authorityCall } from '../../lib/admin-write';
import { PROTOCOL_CHAIN } from '../../lib/chains';
import { describeError } from '../../lib/errors';
import { notifyTransaction } from '../../lib/notifications';

/** `type(uint16).max` means the band has no upper bound. */
const NO_LIMIT = 65_535;
const MAX_BANDS = 32;

/** No lower bound: the contract requires each floor to equal the previous ceiling, so it is derived. */
interface Row {
  /** Percent. Empty means no upper bound. */
  upTo: string;
  /** Percent of the reserve per window. */
  sell: string;
}

interface AdminBandsCardProps {
  contractAddress: `0x${string}`;
  abi: Abi;
  isAdminMode: boolean;
  isCorrectNetwork: boolean;
}

const EMPTY: Row[] = [{ upTo: '', sell: '' }];

export function AdminBandsCard({
  contractAddress,
  abi,
  isAdminMode,
  isCorrectNetwork,
}: AdminBandsCardProps) {
  const cardId = useId();
  const [rows, setRows] = useState<Row[]>(EMPTY);
  const [loadedFrom, setLoadedFrom] = useState<string | null>(null);
  const [edited, setEdited] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);
  const notifiedSuccess = useRef(false);
  const notifiedError = useRef<string | null>(null);

  const { data, refetch } = useReadContracts({
    contracts: [
      {
        chainId: PROTOCOL_CHAIN.id,
        address: contractAddress,
        abi,
        functionName: 'getBands',
      },
      {
        chainId: PROTOCOL_CHAIN.id,
        address: contractAddress,
        abi,
        functionName: 'MAX_SELL_BPS_PER_WINDOW',
      },
    ],
  });

  const current = (
    data?.[0]?.status === 'success' ? data[0].result : []
  ) as ReadonlyArray<{
    premiumMinBps: number;
    premiumMaxBps: number;
    sellBpsPerWindow: number;
  }>;

  const maxSellBps =
    data?.[1]?.status === 'success' ? Number(data[1].result) : undefined;

  // The call replaces the whole ladder, so start from what is set.
  const signature = useMemo(
    () =>
      current
        .map(
          (b) => `${b.premiumMinBps}-${b.premiumMaxBps}-${b.sellBpsPerWindow}`,
        )
        .join('|'),
    [current],
  );

  // Stops seeding once the table is edited, so a late read cannot overwrite typed values.
  useEffect(() => {
    if (!signature || loadedFrom === signature || edited) return;
    setRows(
      current.map((band) => ({
        upTo:
          band.premiumMaxBps === NO_LIMIT
            ? ''
            : String(band.premiumMaxBps / 100),
        sell: String(band.sellBpsPerWindow / 100),
      })),
    );
    setLoadedFrom(signature);
  }, [signature, loadedFrom, current, edited]);

  const ensureChain = useEnsureProtocolChain();

  const { mutate } = useWriteContract({
    mutation: {
      onSuccess: (txHash) => {
        setHash(txHash);
        setIsPending(false);
      },
      onError: (err) => {
        setError(err instanceof Error ? err : new Error('Transaction failed'));
        setIsPending(false);
      },
    },
  });

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  useEffect(() => {
    if (isConfirmed && !notifiedSuccess.current) {
      notifyTransaction.success('write', hash, 'Premium bands updated');
      notifiedSuccess.current = true;
      setLoadedFrom(null);
      setEdited(false);
      refetch();
    }
  }, [isConfirmed, hash, refetch]);

  useEffect(() => {
    const currentError = error || receiptError;
    if (currentError && notifiedError.current !== currentError.message) {
      notifyTransaction.error('write', currentError, hash);
      notifiedError.current = currentError.message;
    }
  }, [error, receiptError, hash]);

  useEffect(() => {
    notifiedSuccess.current = false;
    notifiedError.current = null;
  }, [hash]);

  /** Mirrors the contract checks, in order, so a passing table cannot revert with `InvalidBands`. */
  const built = useMemo(() => {
    const errors: Record<string, string> = {};
    const bands: Array<[number, number, number]> = [];
    let floor = 0;

    rows.forEach((row, i) => {
      const last = i === rows.length - 1;

      let ceiling: number;
      if (row.upTo.trim() === '') {
        if (!last) {
          errors[`${i}.upTo`] = 'Only the last band may run to no limit';
          ceiling = floor;
        } else {
          ceiling = NO_LIMIT;
        }
      } else if (!DECIMAL.test(row.upTo.trim())) {
        errors[`${i}.upTo`] = 'Enter a percentage, 10 means 10%';
        ceiling = floor;
      } else {
        ceiling = percentToBps(row.upTo);
        if (ceiling <= floor) {
          errors[`${i}.upTo`] =
            `Must be above ${bpsToPercent(floor)}, where this band starts`;
        }
      }

      let sell: number;
      if (row.sell.trim() === '') {
        errors[`${i}.sell`] = 'Required';
        sell = 0;
      } else if (!DECIMAL.test(row.sell.trim())) {
        errors[`${i}.sell`] = 'Enter a percentage, 0.5 means 0.5%';
        sell = 0;
      } else {
        sell = percentToBps(row.sell);
        if (maxSellBps !== undefined && sell > maxSellBps) {
          errors[`${i}.sell`] =
            `The contract allows at most ${bpsToPercent(maxSellBps)} per window`;
        }
        const previous = bands[i - 1]?.[2];
        if (previous !== undefined && sell < previous) {
          errors[`${i}.sell`] =
            `Cannot be below ${bpsToPercent(previous)}: a higher premium may never sell less`;
        }
      }

      bands.push([floor, ceiling, sell]);
      floor = ceiling;
    });

    if (rows.length === 0) errors.table = 'At least one band is required';
    if (rows.length > MAX_BANDS) {
      errors.table = `At most ${MAX_BANDS} bands`;
    }
    if (bands.length > 0 && bands[0][0] !== 0) {
      errors.table = 'The first band has to start at 0%';
    }

    return { bands, errors };
  }, [rows, maxSellBps]);

  const setRow = (index: number, key: keyof Row, value: string) => {
    setEdited(true);
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  };

  const handleSetBands = async () => {
    if (!isAdminMode || !isCorrectNetwork) return;
    if (Object.keys(built.errors).length > 0) return;

    setError(null);
    setIsPending(true);
    try {
      await ensureChain();
      mutate(authorityCall(contractAddress, abi, 'setBands', [built.bands]));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Could not build the call'),
      );
      setIsPending(false);
    }
  };

  const isProcessing = isPending || isConfirming;
  const canExecute =
    isAdminMode &&
    isCorrectNetwork &&
    Object.keys(built.errors).length === 0 &&
    !isProcessing;

  return (
    <section
      aria-labelledby={`${cardId}-title`}
      className="border-border bg-card col-span-full rounded-lg border p-4"
    >
      <div className="mb-4">
        <h3 id={`${cardId}-title`} className="font-semibold text-white">
          Premium Bands
        </h3>
        <p className="text-muted mt-1 text-sm">
          How far above backing the market has to be before the protocol sells,
          and how much of the reserve it may sell per window at that level. A
          band selling 0% is the range where it holds.
        </p>
      </div>

      <div className="border-border mb-4 rounded-lg border p-3">
        <div className="text-muted mb-2 text-[10px] uppercase tracking-wide">
          live now
        </div>
        {current.length === 0 ? (
          <div className="text-muted text-sm">No bands set</div>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-white">
            {current.map((band, i) => (
              <span key={i} className="[overflow-wrap:anywhere]">
                {bpsToPercent(band.premiumMinBps)}
                {band.premiumMaxBps === NO_LIMIT
                  ? '+'
                  : `–${bpsToPercent(band.premiumMaxBps)}`}
                <span className="text-muted"> sell </span>
                {bpsToPercent(band.sellBpsPerWindow)}
              </span>
            ))}
          </div>
        )}
      </div>

      {isAdminMode && (
        <div className="space-y-3">
          {rows.map((row, index) => {
            const startsAt = built.bands[index]?.[0] ?? 0;
            const last = index === rows.length - 1;

            return (
              <div
                key={index}
                className="border-border grid grid-cols-1 items-start gap-3 rounded-lg border p-3 sm:grid-cols-[auto_1fr_1fr_auto]"
              >
                <div className="min-w-0 sm:pt-6">
                  <div className="text-muted text-[10px] uppercase tracking-wide sm:hidden">
                    starts at
                  </div>
                  <div className="whitespace-nowrap font-mono text-sm text-white">
                    from {bpsToPercent(startsAt)}
                  </div>
                </div>

                <div className="min-w-0 space-y-1">
                  <label
                    htmlFor={`band-${index}-upto`}
                    className="text-muted text-xs"
                  >
                    up to{last ? ' (blank = no limit)' : ''}
                  </label>
                  <div className="relative">
                    <Input
                      id={`band-${index}-upto`}
                      type="text"
                      inputMode="decimal"
                      value={row.upTo}
                      onChange={(e) => setRow(index, 'upTo', e.target.value)}
                      placeholder={last ? 'no limit' : '10'}
                      disabled={isProcessing}
                      className={`pr-8 font-mono text-sm ${
                        built.errors[`${index}.upTo`] ? 'border-red' : ''
                      }`}
                    />
                    <span className="text-muted pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                      %
                    </span>
                  </div>
                  {built.errors[`${index}.upTo`] && (
                    <div className="text-red text-xs [overflow-wrap:anywhere]">
                      {built.errors[`${index}.upTo`]}
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <label
                    htmlFor={`band-${index}-sell`}
                    className="text-muted text-xs"
                  >
                    sell per window
                  </label>
                  <div className="relative">
                    <Input
                      id={`band-${index}-sell`}
                      type="text"
                      inputMode="decimal"
                      value={row.sell}
                      onChange={(e) => setRow(index, 'sell', e.target.value)}
                      placeholder="0"
                      disabled={isProcessing}
                      className={`pr-8 font-mono text-sm ${
                        built.errors[`${index}.sell`] ? 'border-red' : ''
                      }`}
                    />
                    <span className="text-muted pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                      %
                    </span>
                  </div>
                  {built.errors[`${index}.sell`] && (
                    <div className="text-red text-xs [overflow-wrap:anywhere]">
                      {built.errors[`${index}.sell`]}
                    </div>
                  )}
                </div>

                <div className="sm:pt-6">
                  {rows.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        {
                          setEdited(true);
                          setRows((prev) => prev.filter((_, i) => i !== index));
                        }
                      }
                      disabled={isProcessing}
                      className="h-9 w-9 p-0"
                      aria-label={`Remove band ${index + 1}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEdited(true);
              setRows((prev) => [...prev, { upTo: '', sell: '' }]);
            }}
            disabled={isProcessing || rows.length >= MAX_BANDS}
            className="w-full"
          >
            <Plus size={16} className="mr-2" />
            Add band
          </Button>

          {built.errors.table && (
            <div className="text-red flex items-start gap-1.5 text-xs">
              <AlertCircle size={13} className="mt-px shrink-0" />
              <span>{built.errors.table}</span>
            </div>
          )}

          <Button
            onClick={() => void handleSetBands()}
            disabled={!canExecute}
            className="w-full"
          >
            {isProcessing
              ? isConfirming
                ? 'Confirming…'
                : 'Sending…'
              : isConfirmed
                ? 'Updated'
                : 'Replace the ladder'}
          </Button>
          <p className="text-muted text-xs">
            This replaces every band at once, not just the ones edited.
          </p>

          {error && (
            <div className="text-red text-xs [overflow-wrap:anywhere]">
              {describeError(error).detail}
            </div>
          )}
        </div>
      )}

      {!isCorrectNetwork && isAdminMode && (
        <div className="text-orange mt-2 text-xs">
          Switch the wallet to {PROTOCOL_CHAIN.name} to make changes
        </div>
      )}
    </section>
  );
}
