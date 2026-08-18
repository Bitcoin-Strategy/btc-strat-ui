import { useId, useEffect, useMemo, useRef, useState } from 'react';
import {
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { formatContractValue, previewOf, toContractValue } from './field-logic';
import { FieldRow } from './field-row';
import type { FieldPresentation, InputType } from './types';
import {
  checkBound,
  formatInputPlaceholder,
  validateInput,
} from './validation';

import { Button } from '../../components/ui';
import { useEnsureProtocolChain } from '../../hooks/use-ensure-chain';
import { authorityCall } from '../../lib/admin-write';
import { PROTOCOL_CHAIN } from '../../lib/chains';
import { describeError } from '../../lib/errors';
import { notifyTransaction } from '../../lib/notifications';

export interface FieldConfig extends FieldPresentation {
  name: string;
  label: string;
  description?: string;
  inputType: InputType;
  /** Omitted for a write-only field. */
  readFunctionName?: string;
  readTransform?: (value: any) => string;
  writeTransform?: (value: string, allValues?: Record<string, string>) => any;
  placeholder?: string;
  selectOptions?: Array<{ label: string; value: string }>;
}

interface AdminMultiInputCardProps {
  title: string;
  description?: string;
  fields: FieldConfig[];
  contractAddress: `0x${string}`;
  abi: any;
  writeFunctionName: string;
  isAdminMode: boolean;
  isCorrectNetwork: boolean;
  requireAllFields?: boolean;
  /** Cross-field rules, keyed by the field to blame. */
  validate?: (values: Record<string, string>) => Record<string, string> | null;
}

export function AdminMultiInputCard({
  title,
  description,
  fields,
  contractAddress,
  abi,
  writeFunctionName,
  isAdminMode,
  isCorrectNetwork,
  requireAllFields = false,
  validate,
}: AdminMultiInputCardProps) {
  const cardId = useId();
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({});
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);
  const notifiedSuccess = useRef(false);
  const notifiedError = useRef<string | null>(null);

  const readFields = useMemo(
    () => fields.filter((field) => field.readFunctionName && !field.writeOnly),
    [fields],
  );
  const boundFields = useMemo(
    () => fields.filter((field) => field.bound),
    [fields],
  );

  const contracts = useMemo(
    () =>
      [...readFields, ...boundFields].map((field, i) => ({
        chainId: PROTOCOL_CHAIN.id,
        address: contractAddress,
        abi,
        functionName:
          i < readFields.length ? field.readFunctionName! : field.bound!.fn,
      })),
    [readFields, boundFields, contractAddress, abi],
  );

  const {
    data: contractsData,
    isLoading: contractsLoading,
    refetch: refetchAll,
  } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0 },
  });

  const resultAt = (index: number) => {
    const result = contractsData?.[index];
    return result?.status === 'success' ? result.result : undefined;
  };

  const currentByName = useMemo(() => {
    const map: Record<string, unknown> = {};
    readFields.forEach((field, i) => {
      map[field.name] = resultAt(i);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractsData, readFields]);

  const bounds = useMemo(() => {
    const map: Record<string, unknown> = {};
    boundFields.forEach((field, i) => {
      map[field.name] = resultAt(readFields.length + i);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractsData, boundFields, readFields.length]);

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
      notifyTransaction.success('write', hash, `${title} updated`);
      notifiedSuccess.current = true;
      refetchAll();
      setInputValues({});
    }
  }, [isConfirmed, hash, title, refetchAll]);

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

  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    for (const field of fields) {
      const typed = inputValues[field.name];
      if (!typed || typed.trim() === '') continue;

      const check = validateInput(typed, field.inputType, field.unit);
      if (!check.valid) {
        errors[field.name] = check.error!;
        continue;
      }

      const bound = bounds[field.name];
      if (field.bound && bound !== undefined) {
        let sent: unknown;
        try {
          sent = toContractValue(
            typed,
            field.inputType,
            field.writeTransform,
            inputValues,
          );
        } catch {
          continue;
        }
        const message = checkBound(
          sent,
          BigInt(bound as bigint),
          field.bound.kind,
          formatContractValue(
            bound,
            field.inputType,
            field.preview ?? field.readTransform,
          ),
        );
        if (message) errors[field.name] = message;
      }
    }

    if (validate && Object.keys(errors).length === 0) {
      Object.assign(errors, validate(inputValues) ?? {});
    }

    return { ...errors, ...submitErrors };
  }, [fields, inputValues, bounds, validate, submitErrors]);

  const handleInputChange = (fieldName: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [fieldName]: value }));
    setSubmitErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const handleWrite = async () => {
    if (!isAdminMode || !isCorrectNetwork) return;

    const missing: Record<string, string> = {};
    if (requireAllFields) {
      fields.forEach((field) => {
        const typed = inputValues[field.name];
        if (field.inputType !== 'checkbox' && (!typed || typed.trim() === '')) {
          missing[field.name] = 'Required';
        }
      });
    }

    if (Object.keys(missing).length > 0) {
      setSubmitErrors(missing);
      return;
    }
    if (Object.keys(fieldErrors).length > 0) return;

    setError(null);
    setSubmitErrors({});
    setIsPending(true);

    try {
      const args = fields.map((field) => {
        const typed = inputValues[field.name];

        if (!typed || typed.trim() === '') {
          if (field.inputType === 'checkbox') return false;
          if (requireAllFields) {
            throw new Error(`${field.label} is required`);
          }
          // Blank means keep the current value.
          return currentByName[field.name];
        }

        return toContractValue(
          typed,
          field.inputType,
          field.writeTransform,
          inputValues,
        );
      });

      await ensureChain();
      mutate(authorityCall(contractAddress, abi, writeFunctionName, args));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Could not build the call'),
      );
      setIsPending(false);
    }
  };

  const isProcessing = isPending || isConfirming;
  const canWrite =
    isAdminMode &&
    isCorrectNetwork &&
    Object.keys(fieldErrors).length === 0 &&
    !isProcessing;

  return (
    <section
      aria-labelledby={`${cardId}-title`}
      className="border-border bg-card col-span-full rounded-lg border p-4"
    >
      <div className="mb-4">
        <h3 id={`${cardId}-title`} className="font-semibold text-white">
          {title}
        </h3>
        {description && (
          <p className="text-muted mt-1 text-sm">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        {fields.map((field) => {
          const bound = bounds[field.name];
          const boundLabel =
            field.bound && bound !== undefined
              ? `${field.bound.kind === 'max' ? 'At most' : 'At least'} ${formatContractValue(
                  bound,
                  field.inputType,
                  field.preview ?? field.readTransform,
                )}`
              : undefined;

          return (
            <FieldRow
              key={field.name}
              label={field.label}
              description={field.description}
              inputType={field.inputType}
              unit={field.unit}
              placeholder={
                field.placeholder ||
                formatInputPlaceholder(field.inputType, field.unit)
              }
              current={
                field.writeOnly || !field.readFunctionName
                  ? undefined
                  : contractsLoading
                    ? 'reading…'
                    : formatContractValue(
                        currentByName[field.name],
                        field.inputType,
                        field.readTransform,
                      )
              }
              preview={previewOf(
                inputValues[field.name] ?? '',
                field.inputType,
                field,
                inputValues,
              )}
              boundLabel={boundLabel}
              value={inputValues[field.name] ?? ''}
              onChange={(value) => handleInputChange(field.name, value)}
              error={fieldErrors[field.name]}
              disabled={!isCorrectNetwork || isProcessing}
              editable={isAdminMode}
              selectOptions={field.selectOptions}
            />
          );
        })}
      </div>

      {isAdminMode && (
        <div className="mt-5 space-y-2">
          <Button
            onClick={() => void handleWrite()}
            disabled={!canWrite}
            className="w-full"
          >
            {isProcessing
              ? isConfirming
                ? 'Confirming…'
                : 'Sending…'
              : isConfirmed
                ? 'Updated'
                : requireAllFields
                  ? title
                  : 'Save changes'}
          </Button>
          {!requireAllFields && (
            <p className="text-muted text-xs">
              A field left blank keeps the value it has now.
            </p>
          )}
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
