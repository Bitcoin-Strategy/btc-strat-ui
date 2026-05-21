import { useCallback, useState } from 'react';
import { parseUnits } from 'viem';
import {
  useConnection,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { useEnsureProtocolChain } from './use-ensure-chain';

import { TREASURY_ABI } from '../lib/abi/treasury';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';

type UseRedeemParams = {
  amount: string;
  decimals?: number;
  enabled?: boolean;
  // BTC (WAD). Zero means no floor.
  minNetBtc?: bigint;
};

/** Calls the Treasury, which prices through Redemption and takes STRAT from the caller's stake. No approval needed. */
export const useRedeem = ({
  amount,
  decimals = 18,
  enabled = true,
  minNetBtc,
}: UseRedeemParams) => {
  const amountBigInt =
    amount && parseFloat(amount) > 0 ? parseUnits(amount, decimals) : undefined;

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

  const redeem = async () => {
    if (!amountBigInt || !enabled || !address || !mutate) return;

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
      address: ADDRESSES.TREASURY,
      abi: TREASURY_ABI,
      functionName: 'redeem',
      args: [amountBigInt, minNetBtc ?? 0n],
    });
  };

  const reset = useCallback(() => {
    setHash(undefined);
    setError(null);
  }, []);

  return {
    redeem,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    isSuccess: isConfirmed,
    error: error || receiptError,
    reset,
  };
};
