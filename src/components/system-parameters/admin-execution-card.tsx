import { useId, useEffect, useMemo, useRef, useState } from 'react';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

import { previewOf, toContractValue } from './field-logic';
import { FieldRow } from './field-row';
import type { FieldPresentation, InputType } from './types';
import { formatInputPlaceholder, validateInput } from './validation';

import { Button } from '../../components/ui';
import { useEnsureProtocolChain } from '../../hooks/use-ensure-chain';
import { authorityCall } from '../../lib/admin-write';
import { PROTOCOL_CHAIN } from '../../lib/chains';
import { describeError } from '../../lib/errors';
import { notifyTransaction } from '../../lib/notifications';

export interface ExecutionFieldConfig extends FieldPresentation {
  name: string;
  label: string;
  description?: string;
  inputType: InputType;
  placeholder?: string;
  writeTransform?: (value: string) => any;
}

interface AdminExecutionCardProps {
  title: string;
  description?: string;
  fields: ExecutionFieldConfig[];
  contractAddress: `0x${string}`;
  abi: any;
  writeFunctionName: string;
  // Owner calls go through the authority; permissionless ones keep the sender.
  viaAuthority?: boolean;
  isAdminMode: boolean;
  isCorrectNetwork: boolean;
  requireAllFields?: boolean;
  actionLabel?: string;
  validate?: (values: Record<string, string>) => Record<string, string> | null;
}

export function AdminExecutionCard({
  title,
  description,
  fields,
  contractAddress,
  abi,
  writeFunctionName,
  viaAuthority = false,
  isAdminMode,
  isCorrectNetwork,
  requireAllFields = true,
  actionLabel,
  validate,
}: AdminExecutionCardProps) {
  const cardId = useId();
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({});
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);
  const notifiedSuccess = useRef(false);
  const notifiedError = useRef<string | null>(null);

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
      notifyTransaction.success('write', hash, `${title} done`);
      notifiedSuccess.current = true;
      setInputValues({});
    }
  }, [isConfirmed, hash, title]);

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
      if (!check.valid) errors[field.name] = check.error!;
    }
    if (validate && Object.keys(errors).length === 0) {
      Object.assign(errors, validate(inputValues) ?? {});
    }
    return { ...errors, ...submitErrors };
  }, [fields, inputValues, validate, submitErrors]);

  const handleInputChange = (fieldName: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [fieldName]: value }));
    setSubmitErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const handleExecute = async () => {
    if (!isAdminMode || !isCorrectNetwork) return;

    const missing: Record<string, string> = {};
    if (requireAllFields) {
      fields.forEach((field) => {
        const typed = inputValues[field.name];
        if (!typed || typed.trim() === '') missing[field.name] = 'Required';
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
      const args = fields.map((field) =>
        toContractValue(
          inputValues[field.name],
          field.inputType,
          field.writeTransform,
          inputValues,
        ),
      );

      await ensureChain();
      mutate(
        viaAuthority
          ? authorityCall(contractAddress, abi, writeFunctionName, args)
          : {
              chainId: PROTOCOL_CHAIN.id,
              address: contractAddress,
              abi,
              functionName: writeFunctionName,
              args,
            },
      );
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

      {fields.length > 0 && (
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          {fields.map((field) => (
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
              preview={previewOf(
                inputValues[field.name] ?? '',
                field.inputType,
                field,
                inputValues,
              )}
              value={inputValues[field.name] ?? ''}
              onChange={(value) => handleInputChange(field.name, value)}
              error={fieldErrors[field.name]}
              disabled={!isCorrectNetwork || isProcessing}
              editable={isAdminMode}
            />
          ))}
        </div>
      )}

      {isAdminMode && (
        <div className="mt-4 space-y-2">
          <Button
            onClick={() => void handleExecute()}
            disabled={!canExecute}
            className="w-full"
          >
            {isProcessing
              ? isConfirming
                ? 'Confirming…'
                : 'Sending…'
              : isConfirmed
                ? 'Done'
                : (actionLabel ?? 'Run')}
          </Button>
          {error && (
            <div className="text-red text-xs [overflow-wrap:anywhere]">
              {describeError(error).detail}
            </div>
          )}
        </div>
      )}

      {!isCorrectNetwork && isAdminMode && (
        <div className="text-orange mt-2 text-xs">
          Switch the wallet to {PROTOCOL_CHAIN.name} to run this
        </div>
      )}
    </section>
  );
}
