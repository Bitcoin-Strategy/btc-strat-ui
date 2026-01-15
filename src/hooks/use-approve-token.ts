import { useCallback, useState } from 'react';
import { maxUint256, parseUnits } from 'viem';
import {
  useConnection,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { useEnsureProtocolChain } from './use-ensure-chain';

import { ERC20_ABI } from '../lib/abi/erc20';
import { PROTOCOL_CHAIN } from '../lib/chains';

type UseApproveTokenParams = {
  tokenAddress: `0x${string}` | undefined;
  spenderAddress: `0x${string}` | undefined;
  amount?: string;
  decimals?: number;
  // Raw units, e.g. a swap output, so it never round-trips through a formatted string.
  amountRaw?: bigint;
  enabled?: boolean;
};

export const useApproveToken = ({
  tokenAddress,
  spenderAddress,
  amount,
  decimals = 18,
  amountRaw,
  enabled = true,
}: UseApproveTokenParams) => {
  const { address } = useConnection();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const resolveAmount = (): bigint | undefined => {
    if (amountRaw !== undefined) return amountRaw > 0n ? amountRaw : undefined;
    if (!amount || parseFloat(amount) <= 0) return undefined;
    return parseUnits(amount, decimals);
  };

  const amountBigInt = resolveAmount();

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && spenderAddress ? [address, spenderAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!spenderAddress && !!address && enabled,
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
        setError(err instanceof Error ? err : new Error('Approval failed'));
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

  const approve = async () => {
    if (!tokenAddress || !spenderAddress || !enabled || !address || !mutate) {
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
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress, maxUint256],
    });
  };

  const reset = useCallback(() => {
    setHash(undefined);
    setError(null);
  }, []);

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    isSuccess: isConfirmed,
    error: error || receiptError,
    needsApproval,
    allowance,
    refetchAllowance,
    reset,
  };
};
