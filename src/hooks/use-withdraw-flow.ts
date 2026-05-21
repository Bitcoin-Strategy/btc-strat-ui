import { useEffect, useRef } from 'react';
import { formatUnits } from 'viem';

import { usePendingWithdrawal } from './use-pending-withdrawal';
import { useProtocolChain } from './use-protocol-chain';
import { useWithdraw } from './use-withdraw';

import { notifyTransaction } from '../lib/notifications';

type UseWithdrawFlowParams = {
  enabled?: boolean;
  onSuccess?: () => void;
};

const countdown = (seconds: number) => {
  if (seconds <= 0) return 'now';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const useWithdrawFlow = ({
  enabled = true,
  onSuccess,
}: UseWithdrawFlowParams = {}) => {
  const { onProtocolChain: isCorrectNetwork } = useProtocolChain();
  const pending = usePendingWithdrawal();

  const { withdraw, isPending, isConfirming, isSuccess, error, reset } =
    useWithdraw({ enabled: enabled && isCorrectNetwork });

  const notified = useRef(false);
  const errorNotified = useRef<string | null>(null);
  const amountAtSend = useRef<bigint>(0n);

  useEffect(() => {
    if (isSuccess && !notified.current) {
      notifyTransaction.success(
        'unstake',
        undefined,
        `Withdrew ${formatUnits(amountAtSend.current, 18)} STRAT`,
      );
      notified.current = true;
      pending.refetch().catch(() => undefined);
      onSuccess?.();
    }
  }, [isSuccess, onSuccess, pending]);

  useEffect(() => {
    if (error && errorNotified.current !== error.message) {
      notifyTransaction.error('unstake', error);
      errorNotified.current = error.message;
    }
  }, [error]);

  const isProcessing = isPending || isConfirming;

  const execute = () => {
    amountAtSend.current = pending.amount;
    notified.current = false;
    errorNotified.current = null;
    reset();
    void withdraw();
  };

  const buttonText = (() => {
    if (isProcessing) return isConfirming ? 'Confirming…' : 'Withdrawing…';
    if (isSuccess) return 'Withdrawn';
    if (!pending.hasPending) return 'Nothing to withdraw';
    if (!pending.isReady) return `Ready in ${countdown(pending.secondsLeft)}`;
    return 'Withdraw STRAT';
  })();

  return {
    execute,
    buttonText,
    countdown: countdown(pending.secondsLeft),
    pendingAmount: pending.amount,
    pendingAmountFormatted: formatUnits(pending.amount, 18),
    hasPending: pending.hasPending,
    isReady: pending.isReady,
    secondsLeft: pending.secondsLeft,
    canExecute: pending.isReady && !isProcessing && isCorrectNetwork && enabled,
    isProcessing,
    isSuccess,
    error,
    isCorrectNetwork,
    refetch: pending.refetch,
  };
};
