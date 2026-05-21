import { useEffect, useRef } from 'react';

import { useProtocolChain } from './use-protocol-chain';
import { useUnstake } from './use-unstake';

import { notifyTransaction } from '../lib/notifications';

type UseUnstakeFlowParams = {
  amount: string;
  enabled?: boolean;
  onSuccess?: () => void;
};

export const useUnstakeFlow = ({
  amount,
  enabled = true,
  onSuccess,
}: UseUnstakeFlowParams) => {
  const { onProtocolChain: isCorrectNetwork } = useProtocolChain();

  const isEnabled = enabled && !!amount && parseFloat(amount) > 0;

  const { unstake, isPending, isConfirming, isSuccess, error, reset } =
    useUnstake({
      amount,
      decimals: 18,
      enabled: isEnabled && isCorrectNetwork,
    });

  const notified = useRef(false);
  const errorNotified = useRef<string | null>(null);

  useEffect(() => {
    if (isSuccess && !notified.current) {
      notifyTransaction.success(
        'unstake',
        undefined,
        `${amount} STRAT queued to unstake. Withdraw it once the cooldown has run.`,
      );
      notified.current = true;
      onSuccess?.();
    }
  }, [isSuccess, amount, onSuccess]);

  useEffect(() => {
    if (error && errorNotified.current !== error.message) {
      notifyTransaction.error('unstake', error);
      errorNotified.current = error.message;
    }
  }, [error]);

  useEffect(() => {
    reset();
    notified.current = false;
    errorNotified.current = null;
  }, [amount, reset]);

  const execute = () => {
    void unstake();
  };

  const isProcessing = isPending || isConfirming;

  const canExecute =
    !!amount && parseFloat(amount) > 0 && !isProcessing && isCorrectNetwork;

  const getButtonText = () => {
    if (isProcessing) {
      if (isConfirming) return 'Confirming Request...';
      if (isPending) return 'Requesting...';
      return 'Processing...';
    }
    if (isSuccess) return 'Unstake Requested';
    return 'Request Unstake';
  };

  return {
    execute,
    isProcessing,
    canExecute,
    buttonText: getButtonText(),
    error,
    isSuccess,
    isCorrectNetwork,
  };
};
