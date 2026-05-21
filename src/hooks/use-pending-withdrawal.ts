import { useConnection, useReadContract } from 'wagmi';

import { useChainTime } from './use-chain-time';

import { STAKING_ABI } from '../lib/abi/staking';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';

type PendingWithdrawal = {
  amount: bigint;
  readyAt: bigint;
};

/** The unstake amount waiting for `withdraw`. Readiness uses chain time. */
export const usePendingWithdrawal = () => {
  const { address } = useConnection();
  const now = useChainTime(1000);

  const { data, isLoading, error, refetch } = useReadContract({
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.STAKING,
    abi: STAKING_ABI,
    functionName: 'pendingWithdrawalOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const pending = data as PendingWithdrawal | undefined;
  const amount = pending?.amount ?? 0n;
  const readyAt = Number(pending?.readyAt ?? 0n);

  const hasPending = amount > 0n;
  const secondsLeft = hasPending
    ? Math.max(0, readyAt - Math.floor(now / 1000))
    : 0;

  return {
    amount,
    readyAt,
    hasPending,
    isReady: hasPending && secondsLeft === 0,
    secondsLeft,
    isLoading,
    error,
    refetch,
  };
};
