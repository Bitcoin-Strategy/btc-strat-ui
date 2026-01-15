'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { WagmiProvider } from 'wagmi';

import { REFRESH, STALE } from './refresh';
import { getWagmiConfig } from './wagmi';

/** One public RPC: no refetch on focus, a single retry, and a stale time that makes page switches cheap. */
const queryDefaults = {
  queries: {
    staleTime: STALE.live,
    gcTime: 15 * 60_000,
    refetchInterval: REFRESH.live,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  },
} as const;

export function WagmiProviderComp({
  children,
}: {
  readonly children: ReactNode;
}) {
  const config = useMemo(() => getWagmiConfig(), []);
  const queryClient = useMemo(
    () => new QueryClient({ defaultOptions: queryDefaults }),
    [],
  );

  if (!config) {
    return null;
  }

  return (
    <WagmiProvider config={config} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
