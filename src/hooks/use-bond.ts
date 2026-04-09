import { useCallback, useState } from 'react';
import {
  useConnection,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { useEnsureProtocolChain } from './use-ensure-chain';

import { BONDING_ABI } from '../lib/abi/bonding';
import { ERC20_ABI } from '../lib/abi/erc20';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';

type UseBondParams = {
  seriesId: number | string;
  // Raw cbBTC; after a swap, the amount from its receipt.
  amountRaw: bigint | undefined;
  tokenAddress?: `0x${string}`;
  enabled?: boolean;
  minStratOut?: bigint;
};

/** No `maxBtcIn` budget: Bonding sizes the liquidity legs to the bond itself. */
const LIQUIDITY_BUDGET = {
  maxBtcIn: 2n ** 256n - 1n,
  minStratOut: 0n,
} as const;

export const useBond = ({
  seriesId,
  amountRaw,
  tokenAddress,
  enabled = true,
  minStratOut,
}: UseBondParams) => {
  const seriesIdNum =
    typeof seriesId === 'string' ? parseInt(seriesId, 10) : seriesId;

  const amountInBigInt = amountRaw && amountRaw > 0n ? amountRaw : undefined;

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
    args: address && tokenAddress ? [address, ADDRESSES.BONDING] : undefined,
    query: {
      enabled: enabled && !!tokenAddress && !!address && !!amountInBigInt,
    },
  });

  const needsApproval =
    allowance !== undefined &&
    amountInBigInt !== undefined &&
    allowance < amountInBigInt;

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

  const bond = async () => {
    if (!amountInBigInt || !enabled || !address || !mutate) {
      return;
    }

    if (needsApproval) {
      setError(
        new Error(
          'Token approval required. Please approve the bonding contract to spend your tokens first.',
        ),
      );
      return;
    }

    setError(null);
    setIsPending(true);

    // No fixed gas limit: Bonding rejects a bond with too little gas for its liquidity leg.
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
      address: ADDRESSES.BONDING,
      abi: BONDING_ABI,
      functionName: 'bond',
      args: [
        seriesIdNum as number,
        amountInBigInt,
        minStratOut ?? 0n,
        LIQUIDITY_BUDGET,
      ],
    });
  };

  const reset = useCallback(() => {
    setHash(undefined);
    setError(null);
  }, []);

  return {
    bond,
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
