import { formatUnits } from 'viem';
import { useReadContract } from 'wagmi';

import { BONDING_ABI } from '../lib/abi/bonding';
import { ADDRESSES } from '../lib/addresses';

export type UseBondPreviewParams = {
  seriesId: number | string;
  amountRaw: bigint | undefined;
  enabled?: boolean;
};

/** Also sent as `minStratOut`, so a repriced series reverts the bond instead of filling it. */
export const useBondPreview = ({
  seriesId,
  amountRaw,
  enabled = true,
}: UseBondPreviewParams) => {
  const seriesIdNum =
    typeof seriesId === 'string' ? parseInt(seriesId, 10) : seriesId;

  const amountIn = amountRaw && amountRaw > 0n ? amountRaw : undefined;

  const { data, isLoading, error, refetch } = useReadContract({
    address: ADDRESSES.BONDING,
    abi: BONDING_ABI,
    functionName: 'preview',
    args:
      Number.isFinite(seriesIdNum) && amountIn !== undefined
        ? [seriesIdNum as number, amountIn]
        : undefined,
    query: {
      enabled:
        enabled && Number.isFinite(seriesIdNum) && amountIn !== undefined,
    },
  });

  const vvestOut = data as bigint | undefined;

  return {
    vvestOut,
    formattedVvest: vvestOut ? formatUnits(vvestOut, 18) : '0',
    isLoading,
    error,
    refetch,
  };
};
