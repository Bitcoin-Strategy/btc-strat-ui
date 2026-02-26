import { useReadContract } from 'wagmi';

import { POOL_HOOK_ABI } from '../lib/abi/pool-hook';
import { ADDRESSES, STRAT_BTC_POOL_ID } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';
import { REFRESH, STALE } from '../lib/refresh';

/**
 * Whether the STRAT/cbBTC pool exists: only the hook's `_afterInitialize` sets its observation cardinality.
 * Stricter `oracleReady` also needs a full TWAP window. Polls until true, then stops.
 */
export const useMarketPhase = () => {
  const { data, isLoading, error } = useReadContract({
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.POOL_HOOK,
    abi: POOL_HOOK_ABI,
    functionName: 'observationState',
    args: [STRAT_BTC_POOL_ID],
    query: {
      refetchInterval: (query) => {
        const seen = query.state.data as
          readonly [number, number, number] | undefined;
        return seen !== undefined && seen[1] > 0 ? REFRESH.never : REFRESH.slow;
      },
      staleTime: STALE.slow,
    },
  });

  // `(index, cardinality, cardinalityNext)`
  const state = data as readonly [number, number, number] | undefined;
  const cardinality = state?.[1];

  return {
    poolOpen: cardinality === undefined ? undefined : cardinality > 0,
    isLoading,
    error: error ?? null,
  };
};
