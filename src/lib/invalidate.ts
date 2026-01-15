import type { QueryClient, QueryKey } from '@tanstack/react-query';

import { PRICE_FEED_CHAIN_ID } from './chains';

/** Refetches everything a protocol-chain transaction could have changed, skipping the price feed chain and the subgraph. */

const SUBGRAPH_KEYS = new Set(['nav-history']);

/** Matches wagmi's readContract(s) key shape. Undefined for a key without a chain. */
const chainsIn = (key: QueryKey): number[] | undefined => {
  const params = key[1];
  if (!params || typeof params !== 'object') return undefined;

  const withChain = params as {
    chainId?: unknown;
    contracts?: readonly { chainId?: unknown }[];
  };

  if (typeof withChain.chainId === 'number') return [withChain.chainId];

  if (Array.isArray(withChain.contracts)) {
    const ids = withChain.contracts
      .map((contract) => contract?.chainId)
      .filter((id): id is number => typeof id === 'number');
    return ids.length > 0 ? ids : undefined;
  }

  return undefined;
};

export const isAffectedByProtocolWrite = (key: QueryKey): boolean => {
  if (SUBGRAPH_KEYS.has(String(key[0]))) return false;

  const chains = chainsIn(key);
  if (chains && chains.every((id) => id === PRICE_FEED_CHAIN_ID)) return false;

  return true;
};

/** Call after the receipt confirms, not on the hash. */
export const refreshAfterWrite = (client: QueryClient): Promise<void> =>
  client.invalidateQueries({
    predicate: (query) => isAffectedByProtocolWrite(query.queryKey),
  });
