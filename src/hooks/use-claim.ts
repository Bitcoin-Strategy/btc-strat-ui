import { useEffect, useRef, useState } from 'react';
import {
  useConnection,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { useEnsureProtocolChain } from './use-ensure-chain';

import { VESTING_ABI } from '../lib/abi/vesting';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';
import { notifyTransaction } from '../lib/notifications';

type UseClaimParams = {
  vestCount?: number;
  enabled?: boolean;
};

export const useClaim = ({
  vestCount,
  enabled = true,
}: UseClaimParams = {}) => {
  const { address } = useConnection();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const {
    data: claimableAmount,
    isLoading: isLoadingClaimable,
    error: claimableError,
  } = useReadContract({
    address: ADDRESSES.VESTING,
    abi: VESTING_ABI,
    functionName: 'vestCount',
    args: address ? [address] : undefined,
    query: {
      enabled: enabled && !!address,
    },
  });

  const ensureChain = useEnsureProtocolChain();

  const { mutate } = useWriteContract({
    mutation: {
      onSuccess: (txHash) => {
        setHash(txHash);
        setIsPending(false);
      },
      onError: (err) => {
        setError(err instanceof Error ? err : new Error('Claim failed'));
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

  const claimNotified = useRef(false);
  const errorNotified = useRef<string | null>(null);

  useEffect(() => {
    if (isConfirmed && !claimNotified.current) {
      notifyTransaction.success('claim', hash, 'Vesting tokens claimed');
      claimNotified.current = true;
    }
  }, [isConfirmed, hash]);

  useEffect(() => {
    const currentError = error || receiptError || claimableError;
    if (currentError && errorNotified.current !== currentError.message) {
      notifyTransaction.error('claim', currentError, hash);
      errorNotified.current = currentError.message;
    }
  }, [error, receiptError, claimableError, hash]);

  const claim = async () => {
    if (!enabled || !address || !mutate) {
      return;
    }

    if (claimableAmount !== undefined && claimableAmount === 0n) {
      setError(new Error('Nothing to claim'));
      return;
    }

    if (vestCount === undefined || vestCount === 0) {
      setError(new Error('No vests to claim'));
      return;
    }

    const idsToClaim = Array.from({ length: vestCount }, (_, i) => i);

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
      address: ADDRESSES.VESTING,
      abi: VESTING_ABI,
      functionName: 'claim',
      args: [idsToClaim.map((id) => BigInt(id))],
    });
  };

  const reset = () => {
    setHash(undefined);
    setError(null);
  };

  return {
    claim,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    isSuccess: isConfirmed,
    error: error || receiptError || claimableError,
    claimableAmount,
    isLoadingClaimable,
    reset,
  };
};
