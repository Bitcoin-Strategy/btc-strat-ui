import { usePriceHistoryFromSubgraph } from './use-price-history-subgraph';
import { useProtocolDashboard } from './use-protocol-dashboard';

export type { ChartDataPoint } from './use-price-history-subgraph';

export const usePriceHistory = () => {
  const { navUsdPerStrat, marketUsdPerStrat, premiumPct, btcPriceUsd } =
    useProtocolDashboard();

  const subgraph = usePriceHistoryFromSubgraph(btcPriceUsd);

  return {
    chartData: subgraph.chartData,
    currency: subgraph.currency,
    isLoading: subgraph.isLoading,
    error: subgraph.error,

    // Live values come from chain, not the series.
    latestNav: navUsdPerStrat,
    latestPrice: marketUsdPerStrat,
    premiumPct,
  };
};
