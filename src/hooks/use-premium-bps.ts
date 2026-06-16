import { useReadContract } from 'wagmi';

import { PREMIUM_SALES_ABI } from '../lib/abi/premium-sales';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';

/** `OracleNotReady` and `PremiumNotPositive` are ordinary states and kept apart. */
export const usePremiumBps = () => {
  const { data, isLoading, error, refetch } = useReadContract({
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.PREMIUM_SALES,
    abi: PREMIUM_SALES_ABI,
    functionName: 'currentPremiumBps',
    query: { retry: false },
  });

  const message = error?.message ?? '';
  const oracleNotReady = message.includes('OracleNotReady');
  const noPremium = message.includes('PremiumNotPositive');

  const premiumBps = data !== undefined ? Number(data as number) : null;

  return {
    premiumBps,
    premiumPct: premiumBps === null ? null : premiumBps / 100,

    oracleNotReady,
    noPremium,

    isLoading,
    error: oracleNotReady || noPremium ? null : (error ?? null),
    refetch,
  };
};
