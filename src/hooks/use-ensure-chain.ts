import { useCallback } from 'react';
import { useConnection, useSwitchChain } from 'wagmi';

import { PROTOCOL_CHAIN } from '../lib/chains';

/** Switches the wallet before a write. Compares the connector chain: `useChainId()` returns the configured one. */
export const useEnsureProtocolChain = () => {
  const { chainId } = useConnection();
  const { switchChainAsync } = useSwitchChain();

  return useCallback(async () => {
    if (chainId === PROTOCOL_CHAIN.id) return;
    await switchChainAsync({ chainId: PROTOCOL_CHAIN.id });
  }, [chainId, switchChainAsync]);
};
