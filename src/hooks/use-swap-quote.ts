import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';

import { PROTOCOL_CHAIN } from '../lib/chains';
import { quoteSwap, type SwapQuote, type SwapVenue } from '../lib/swap';

type UseSwapQuoteParams = {
  venue: SwapVenue | undefined;
  amountIn: bigint | undefined;
  tokenIn: `0x${string}` | undefined;
  decimalsIn: number;
  decimalsOut: number;
  slippageBps: number;
  enabled?: boolean;
};

// Short enough that the price limit still matches the pool.
const REFRESH_MS = 15_000;

export const useSwapQuote = ({
  venue,
  amountIn,
  tokenIn,
  decimalsIn,
  decimalsOut,
  slippageBps,
  enabled = true,
}: UseSwapQuoteParams) => {
  const client = usePublicClient({ chainId: PROTOCOL_CHAIN.id });

  const isEnabled =
    enabled && !!client && !!venue && !!tokenIn && !!amountIn && amountIn > 0n;

  const { data, isFetching, error, refetch, dataUpdatedAt } =
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    useQuery<SwapQuote>({
      // bigints cannot be hashed into a query key, so everything is keyed by value.
      queryKey: [
        'swap-quote',
        client?.uid,
        venue?.poolId,
        venue?.quoter,
        venue?.stateView,
        tokenIn,
        amountIn?.toString(),
        decimalsIn,
        decimalsOut,
        slippageBps,
      ],
      enabled: isEnabled,
      refetchInterval: REFRESH_MS,
      gcTime: 0,
      retry: false,
      queryFn: () =>
        quoteSwap(client!, {
          venue: venue!,
          amountIn: amountIn!,
          tokenIn: tokenIn!,
          decimalsIn,
          decimalsOut,
          slippageBps,
        }),
    });

  return {
    quote: data,
    isLoading: isFetching,
    error: error as Error | null,
    refetch,
    updatedAt: dataUpdatedAt,
  };
};
