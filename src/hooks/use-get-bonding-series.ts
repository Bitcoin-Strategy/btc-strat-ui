import { useMemo } from 'react';
import { formatUnits } from 'viem';
import { useBlock, useReadContract, useReadContracts } from 'wagmi';

import { useProtocolPrices } from './use-protocol-prices';

import { BONDING_ABI } from '../lib/abi/bonding';
import { ERC20_ABI } from '../lib/abi/erc20';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';
import type { BondSeriesContract } from '../lib/types';
import { btcToUsd, wadToNumber } from '../lib/units';
import type { BondSeries } from '../pages/bonding/types';

export function getSeriesLetter(id: number): string {
  let n = Number(id);
  let letters = '';
  do {
    letters = String.fromCharCode(65 + (n % 26)) + letters;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return letters;
}

/** Compares each series against the pool price, and its net price against NAV. */
export const useGetBondingSeries = () => {
  const bonding = {
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.BONDING,
    abi: BONDING_ABI,
  } as const;

  const { data, isLoading, error, refetch } = useReadContract({
    ...bonding,
    functionName: 'listActiveSeries',
    query: { refetchInterval: 30_000 },
  });

  const series = useMemo<readonly BondSeriesContract[]>(
    () => data ?? [],
    [data],
  );

  const { navBtc, marketBtc, btcUsd } = useProtocolPrices();

  // Uses chain time; the browser clock can be minutes off.
  const { data: block } = useBlock({
    chainId: PROTOCOL_CHAIN.id,
    query: { refetchInterval: 15_000 },
  });

  const { data: quoteAsset } = useReadContract({
    ...bonding,
    functionName: 'BTC_TOKEN',
  });

  const { data: tokenInfo, isLoading: tokenLoading } = useReadContracts({
    contracts: quoteAsset
      ? [
          {
            chainId: PROTOCOL_CHAIN.id,
            address: quoteAsset,
            abi: ERC20_ABI,
            functionName: 'symbol',
          },
          {
            chainId: PROTOCOL_CHAIN.id,
            address: quoteAsset,
            abi: ERC20_ABI,
            functionName: 'decimals',
          },
        ]
      : [],
    query: { enabled: !!quoteAsset },
  });

  const symbol =
    tokenInfo?.[0]?.status === 'success' ? (tokenInfo[0].result as string) : '';
  const decimals =
    tokenInfo?.[1]?.status === 'success' ? Number(tokenInfo[1].result) : 8;

  const { data: netPrices } = useReadContracts({
    contracts: series.map((s) => ({
      ...bonding,
      functionName: 'netBtcPerStratWad' as const,
      args: [s.priceBtcPerStrat],
    })),
    query: { enabled: series.length > 0 },
  });

  const transformedSeries: BondSeries[] = useMemo(() => {
    const now = block ? Number(block.timestamp) : 0;

    return series.map((s, index) => {
      const priceBtc = wadToNumber(s.priceBtcPerStrat);

      const netResult = netPrices?.[index];
      const netBtc =
        netResult?.status === 'success'
          ? wadToNumber(netResult.result as bigint)
          : null;

      const capacityStrat = Number(formatUnits(s.capacityMstrat, 18));
      const filledStrat = Number(formatUnits(s.filledMstrat, 18));
      const startsAt = Number(s.startTime);
      const endsAt = Number(s.endTime);

      return {
        id: s.id.toString(),
        name: `Series ${getSeriesLetter(s.id)}`,

        priceBtc,
        priceUsd: btcToUsd(priceBtc, btcUsd),

        discountVsMarketPct:
          marketBtc && marketBtc > 0 ? (1 - priceBtc / marketBtc) * 100 : null,
        premiumOverNavPct:
          netBtc !== null && navBtc && navBtc > 0
            ? (netBtc / navBtc - 1) * 100
            : null,

        vestingTermSeconds: Number(s.vestingTerm),

        capacityStrat,
        filledStrat,
        remainingStrat: Math.max(capacityStrat - filledStrat, 0),

        minPurchaseBtc: Number(formatUnits(s.minPurchaseBtc, decimals)),

        minPurchaseRaw: s.minPurchaseBtc,
        remainingStratRaw:
          s.capacityMstrat > s.filledMstrat
            ? s.capacityMstrat - s.filledMstrat
            : 0n,

        startsAt,
        endsAt,
        isOpen:
          s.isActive &&
          now >= startsAt &&
          now < endsAt &&
          capacityStrat > filledStrat,

        asset: symbol,
        decimals,
        quoteAsset: (quoteAsset ?? ADDRESSES.BTC) as `0x${string}`,
      };
    });
  }, [
    series,
    netPrices,
    navBtc,
    marketBtc,
    btcUsd,
    symbol,
    decimals,
    quoteAsset,
    block,
  ]);

  return {
    series: transformedSeries,
    isLoading: isLoading || tokenLoading,
    error,
    refetch,
  };
};
