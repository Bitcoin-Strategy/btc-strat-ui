import { useReadContract } from 'wagmi';

import { useNow } from './use-now';

import { BTC_USD_FEED, CHAINLINK_AGGREGATOR_ABI } from '../lib/abi/chainlink';
import { PRICE_FEED_CHAIN_ID } from '../lib/chains';
import { REFRESH, STALE } from '../lib/refresh';

// Three Chainlink heartbeats.
const MAX_STALENESS_SECONDS = 3 * 60 * 60;

/** Display only; nothing in the protocol is priced in USD. */
export const useBtcUsd = () => {
  const now = useNow(60_000);
  const { data, isLoading, error } = useReadContract({
    chainId: PRICE_FEED_CHAIN_ID,
    address: BTC_USD_FEED,
    abi: CHAINLINK_AGGREGATOR_ABI,
    functionName: 'latestRoundData',
    query: { refetchInterval: REFRESH.slow, staleTime: STALE.slow },
  });

  if (!data) {
    return { btcUsd: null, isLoading, error, isStale: false };
  }

  const [, answer, , updatedAt] = data;
  const ageSeconds = Math.floor(now / 1000) - Number(updatedAt);
  const isStale = ageSeconds > MAX_STALENESS_SECONDS;

  const btcUsd = answer > 0n && !isStale ? Number(answer) / 1e8 : null;

  return { btcUsd, isLoading, error, isStale };
};
