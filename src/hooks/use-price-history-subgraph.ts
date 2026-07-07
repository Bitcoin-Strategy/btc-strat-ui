import { useQuery } from '@tanstack/react-query';

import { querySubgraph } from '../lib/subgraph-client';
import { SUBGRAPH_CONFIG } from '../lib/subgraph-config';
import {
  GET_NAV_HISTORY,
  type NavHistoryResponse,
  type NavPointRow,
} from '../lib/subgraph-queries';
import { btcToUsd, wadToNumber } from '../lib/units';

export type ChartDataPoint = {
  date: string;
  nav: number;
  // Null when the oracle had no price.
  price: number | null;
  timestamp: number;
};

export const usePriceHistoryFromSubgraph = (btcPriceUsd: number | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['nav-history', btcPriceUsd],
    refetchInterval: SUBGRAPH_CONFIG.polling.interval,
    queryFn: async (): Promise<NavPointRow[]> => {
      const rows: NavPointRow[] = [];
      for (let page = 0; page < SUBGRAPH_CONFIG.polling.maxPages; page += 1) {
        const response = await querySubgraph<NavHistoryResponse>(
          GET_NAV_HISTORY,
          {
            first: SUBGRAPH_CONFIG.polling.pageSize,
            skip: page * SUBGRAPH_CONFIG.polling.pageSize,
          },
        );
        const batch = response.navPoints ?? [];
        rows.push(...batch);
        if (batch.length < SUBGRAPH_CONFIG.polling.pageSize) break;
      }
      return rows;
    },
  });

  const chartData: ChartDataPoint[] = (data ?? []).map((row) => {
    const navBtc = wadToNumber(BigInt(row.navBtcPerStratWad));
    const marketBtc = row.marketBtcPerStratWad
      ? wadToNumber(BigInt(row.marketBtcPerStratWad))
      : null;
    const timestamp = Number(row.timestamp);

    return {
      timestamp,
      date: new Date(timestamp * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      nav: btcToUsd(navBtc, btcPriceUsd) ?? navBtc,
      price:
        marketBtc === null
          ? null
          : (btcToUsd(marketBtc, btcPriceUsd) ?? marketBtc),
    };
  });

  return {
    chartData,
    currency: btcPriceUsd === null ? 'BTC' : 'USD',
    isLoading,
    error: error ?? null,
  };
};
