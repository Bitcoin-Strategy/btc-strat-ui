import { useReadContract } from 'wagmi';

import { PREMIUM_SALES_ABI } from '../lib/abi/premium-sales';
import { ADDRESSES } from '../lib/addresses';
import { REFRESH, STALE } from '../lib/refresh';

export type Band = {
  premiumMinBps: number;
  premiumMaxBps: number;
  sellBpsPerWindow: number;
};

export const useGetBands = () => {
  const { data, isLoading, error } = useReadContract({
    address: ADDRESSES.PREMIUM_SALES,
    abi: PREMIUM_SALES_ABI,
    functionName: 'getBands',
    query: {
      enabled: !!ADDRESSES.PREMIUM_SALES,
      refetchInterval: REFRESH.slow,
      staleTime: STALE.slow,
    },
  });

  const bands: Band[] =
    data && Array.isArray(data)
      ? data.map((band: Band | [number, number, number]) => {
          if (Array.isArray(band)) {
            return {
              premiumMinBps: Number(band[0] ?? 0),
              premiumMaxBps: Number(band[1] ?? 0),
              sellBpsPerWindow: Number(band[2] ?? 0),
            };
          }
          return {
            premiumMinBps: Number(band.premiumMinBps ?? 0),
            premiumMaxBps: Number(band.premiumMaxBps ?? 0),
            sellBpsPerWindow: Number(band.sellBpsPerWindow ?? 0),
          };
        })
      : [];

  return {
    bands,
    isLoading,
    error,
  };
};
