import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { formatContractValue, previewOf, toContractValue } from './field-logic';
import { FieldRow } from './field-row';
import type { SettingConfig } from './types';
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

interface AdminSettingCardProps {
  config: SettingConfig;
  contractAddress: `0x${string}`;
  abi: any;
  readFunctionName: string;
  writeFunctionName: string;
  writeArgs?: (value: any) => any[];
  readTransform?: (value: any) => string;
  writeTransform?: (value: string) => any;
  // False for a permissionless call, which must keep the sender.
  viaAuthority?: boolean;
  isAdminMode: boolean;
  isCorrectNetwork: boolean;
}

export function AdminSettingCard({
  config,
  contractAddress,
  abi,
  readFunctionName,
  writeFunctionName,
  writeArgs,
  readTransform,
  writeTransform,
  viaAuthority = true,
  isAdminMode,
  isCorrectNetwork,
}: AdminSettingCardProps) {
  const [inputValue, setInputValue] = useState('');
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);
  const notifiedSuccess = useRef(false);
  const notifiedError = useRef<string | null>(null);

  const contracts = useMemo(
    () => [
      {
        chainId: PROTOCOL_CHAIN.id,
        address: contractAddress,
        abi,
        functionName: readFunctionName,
      },
      ...(config.bound
        ? [
            {
              chainId: PROTOCOL_CHAIN.id,
              address: contractAddress,
              abi,
              functionName: config.bound.fn,
            },
          ]
        : []),
    ],
    [contractAddress, abi, readFunctionName, config.bound],
  );

  const {
    data,
    isLoading: isLoadingRead,
    refetch: refetchValue,
  } = useReadContracts({ contracts });

  const currentValue =
    data?.[0]?.status === 'success' ? data[0].result : undefined;
  const bound =
    config.bound && data?.[1]?.status === 'success'
      ? data[1].result
      : undefined;

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
      notifyTransaction.success('write', hash, `${config.label} updated`);
      notifiedSuccess.current = true;
      refetchValue();
      setInputValue('');
    }
  }, [isConfirmed, hash, config.label, refetchValue]);

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

  const field = { ...config, readTransform, writeTransform };

  const validationError = useMemo(() => {
    if (!inputValue || inputValue.trim() === '') return null;

    const check = validateInput(inputValue, config.inputType, config.unit);
    if (!check.valid) return check.error!;

    if (config.bound && bound !== undefined) {
      let sent: unknown;
      try {
        sent = toContractValue(inputValue, config.inputType, writeTransform);
      } catch {
        return null;
      }
      return checkBound(
        sent,
        BigInt(bound as bigint),
        config.bound.kind,
        formatContractValue(
          bound,
          config.inputType,
          config.preview ?? readTransform,
        ),
      );
    }
    return null;
  }, [inputValue, config, bound, writeTransform, readTransform]);

  const handleWrite = async () => {
    if (!isAdminMode || !isCorrectNetwork || !inputValue || validationError) {
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const value = toContractValue(
        inputValue,
        config.inputType,
        writeTransform,
      );
      const args = writeArgs ? writeArgs(value) : [value];

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
  const canWrite =
    isAdminMode &&
    isCorrectNetwork &&
    !!inputValue &&
    !validationError &&
    !isProcessing;

  const boundLabel =
    config.bound && bound !== undefined
      ? `${config.bound.kind === 'max' ? 'At most' : 'At least'} ${formatContractValue(
          bound,
          config.inputType,
          config.preview ?? readTransform,
        )}`
      : undefined;

  return (
    <div className="border-border bg-card flex min-w-0 flex-col rounded-lg border p-4">
      <FieldRow
        label={config.label}
        description={config.description}
        inputType={config.inputType}
        unit={config.unit}
        placeholder={
          config.placeholder ||
          formatInputPlaceholder(config.inputType, config.unit)
        }
        current={
          config.writeOnly
            ? undefined
            : isLoadingRead
              ? 'reading…'
              : formatContractValue(
                  currentValue,
                  config.inputType,
                  readTransform,
                )
        }
        preview={previewOf(inputValue, config.inputType, field)}
        boundLabel={boundLabel}
        value={inputValue}
        onChange={setInputValue}
        error={validationError}
        disabled={!isCorrectNetwork || isProcessing}
        editable={isAdminMode}
      />

      {isAdminMode && (
        <div className="mt-3 space-y-2">
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
                : 'Save'}
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
          Switch the wallet to {PROTOCOL_CHAIN.name} to make changes
        </div>
      )}
    </div>
  );
}
