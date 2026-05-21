import { useCallback, useState } from 'react';
import { parseUnits } from 'viem';
import {
  useConnection,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { useEnsureProtocolChain } from './use-ensure-chain';

import { ERC20_ABI } from '../lib/abi/erc20';
import { STAKING_ABI } from '../lib/abi/staking';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';

type UseStakeParams = {
  amount: string;
  tokenAddress?: `0x${string}`;
  decimals?: number;
  enabled?: boolean;
};

export const useStake = ({
  amount,
  tokenAddress,
  decimals = 18,
  enabled = true,
}: UseStakeParams) => {
  const amountBigInt =
    amount && parseFloat(amount) > 0 ? parseUnits(amount, decimals) : undefined;

  const { address } = useConnection();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const {
    data: allowance,
    isLoading: isLoadingAllowance,
    error: allowanceError,
    refetch: refetchAllowance,
  } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && tokenAddress ? [address, ADDRESSES.STAKING] : undefined,
    query: {
      enabled:
        enabled &&
        !!tokenAddress &&
        !!address &&
        !!amountBigInt &&
        parseFloat(amount) > 0,
    },
  });

  const needsApproval =
    allowance !== undefined &&
    amountBigInt !== undefined &&
    allowance < amountBigInt;

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

  const stake = async () => {
    if (!amountBigInt || !enabled || !address || !mutate) {
      return;
    }

    if (needsApproval) {
      setError(
        new Error(
          'Token approval required. Please approve the staking contract to spend your STRAT tokens first.',
        ),
      );
      return;
    }

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
      functionName: 'stake',
      args: [amountBigInt],
    });
  };

  const reset = useCallback(() => {
    setHash(undefined);
    setError(null);
  }, []);

  return {
    stake,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    isSuccess: isConfirmed,
    error: error || receiptError || allowanceError,
    needsApproval,
    allowance,
    isLoadingAllowance,
    refetchAllowance,
    reset,
  };
};
