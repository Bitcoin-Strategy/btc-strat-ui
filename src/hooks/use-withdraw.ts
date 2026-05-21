import { useCallback, useState } from 'react';
import {
  useConnection,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { useEnsureProtocolChain } from './use-ensure-chain';

import { STAKING_ABI } from '../lib/abi/staking';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';

type UseWithdrawParams = {
  enabled?: boolean;
};

/** Pays out what `requestUnstake` booked; reverts with `WithdrawalNotReady` during the cooldown. */
export const useWithdraw = ({ enabled = true }: UseWithdrawParams = {}) => {
  const { address } = useConnection();

  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

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
    query: {
      enabled: !!hash && enabled,
    },
  });

  const withdraw = async () => {
    if (!enabled || !address || !mutate) return;

    setError(null);
    setIsPending(true);

    try {
      await ensureChain();
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Network switch was refused'),
      );
      setIsPending(false);
      return;
    }

    mutate({
      chainId: PROTOCOL_CHAIN.id,
      address: ADDRESSES.STAKING,
      abi: STAKING_ABI,
      functionName: 'withdraw',
      args: [],
    });
  };

  const reset = useCallback(() => {
    setHash(undefined);
    setError(null);
  }, []);

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    isSuccess: isConfirmed,
    error: error || receiptError,
    reset,
  };
};
