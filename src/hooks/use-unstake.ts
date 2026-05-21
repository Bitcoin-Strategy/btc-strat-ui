import { useCallback, useState } from 'react';
import { parseUnits } from 'viem';
import {
  useConnection,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { useEnsureProtocolChain } from './use-ensure-chain';

import { STAKING_ABI } from '../lib/abi/staking';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';

type UseUnstakeParams = {
  amount: string;
  decimals?: number;
  enabled?: boolean;
};

export const useUnstake = ({
  amount,
  decimals = 18,
  enabled = true,
}: UseUnstakeParams) => {
  const { address } = useConnection();

  const amountBigInt =
    amount && parseFloat(amount) > 0 ? parseUnits(amount, decimals) : undefined;

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

  const unstake = async () => {
    if (!enabled || !address || !mutate || !amountBigInt) return;

    setError(null);
    setIsPending(true);

    // Requesting again restarts the cooldown on everything pending.
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
      functionName: 'requestUnstake',
      args: [amountBigInt],
    });
  };

  const reset = useCallback(() => {
    setHash(undefined);
    setError(null);
  }, []);

  return {
    unstake,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    isSuccess: isConfirmed,
    error: error || receiptError,
    reset,
  };
};
