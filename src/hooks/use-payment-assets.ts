import { useMemo } from 'react';
import { formatUnits } from 'viem';
import { useConnection, useReadContracts } from 'wagmi';

import { ERC20_ABI } from '../lib/abi/erc20';
import { PROTOCOL_CHAIN } from '../lib/chains';
import { REFRESH, STALE } from '../lib/refresh';
import { BOND_PAYMENT_ASSETS, type BondPaymentAsset } from '../lib/swap';

export type PaymentAssetState = {
  asset: BondPaymentAsset;
  symbol: string;
  decimals: number;
  balance: bigint;
  balanceInput: string;
};

/** Symbol and decimals are read from chain; `lib/swap/config.ts` only seeds the first render. */
export const usePaymentAssets = () => {
  const { address } = useConnection();

  const contracts = useMemo(
    () =>
      BOND_PAYMENT_ASSETS.flatMap((asset) => [
        {
          chainId: PROTOCOL_CHAIN.id,
          address: asset.address,
          abi: ERC20_ABI,
          functionName: 'symbol' as const,
        },
        {
          chainId: PROTOCOL_CHAIN.id,
          address: asset.address,
          abi: ERC20_ABI,
          functionName: 'decimals' as const,
        },
        {
          chainId: PROTOCOL_CHAIN.id,
          address: asset.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf' as const,
          args: [
            address ?? '0x0000000000000000000000000000000000000000',
          ] as const,
        },
      ]),
    [address],
  );

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { refetchInterval: REFRESH.slow, staleTime: STALE.slow },
  });

  const assets = useMemo<PaymentAssetState[]>(
    () =>
      BOND_PAYMENT_ASSETS.map((asset, index) => {
        const symbolResult = data?.[index * 3];
        const decimalsResult = data?.[index * 3 + 1];
        const balanceResult = data?.[index * 3 + 2];

        const decimals =
          decimalsResult?.status === 'success'
            ? Number(decimalsResult.result)
            : asset.decimals;
        const balance =
          address && balanceResult?.status === 'success'
            ? (balanceResult.result as bigint)
            : 0n;

        return {
          asset,
          symbol:
            symbolResult?.status === 'success'
              ? (symbolResult.result as string)
              : asset.symbol,
          decimals,
          balance,
          balanceInput: formatUnits(balance, decimals),
        };
      }),
    [data, address],
  );

  return { assets, isLoading, refetch };
};
