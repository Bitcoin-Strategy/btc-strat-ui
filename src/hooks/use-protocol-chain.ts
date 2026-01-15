import { useCallback, useEffect, useRef } from 'react';
import { useConnection, useSwitchChain } from 'wagmi';

import { PROTOCOL_CHAIN } from '../lib/chains';

/** Uses `useConnection().chainId`: `useChainId()` returns the configured chain. The switch is offered once per wrong chain. */
export const useProtocolChain = () => {
  const { isConnected, chainId } = useConnection();
  const { switchChain, isPending, error, reset } = useSwitchChain();

  const onProtocolChain = chainId === PROTOCOL_CHAIN.id;
  const wrongChain = isConnected && !onProtocolChain;

  const switchToProtocol = useCallback(() => {
    reset();
    switchChain({ chainId: PROTOCOL_CHAIN.id });
  }, [switchChain, reset]);

  const asked = useRef<number | null>(null);
  useEffect(() => {
    if (!wrongChain) {
      asked.current = null;
      return;
    }
    if (isPending || asked.current === chainId) return;
    asked.current = chainId ?? null;
    switchChain({ chainId: PROTOCOL_CHAIN.id });
  }, [wrongChain, chainId, isPending, switchChain]);

  return {
    chainId,
    onProtocolChain,
    wrongChain,
    isSwitching: isPending,
    declined: error ?? null,
    switchToProtocol,
    targetName: PROTOCOL_CHAIN.name,
  };
};
