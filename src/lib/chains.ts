import { defineChain } from 'viem';

import { CHAIN, PRICE_FEED } from '../config';

/** Arbitrum Orbit: `block.number` tracks L1, so the protocol uses `block.timestamp`. */
export const PROTOCOL_CHAIN = defineChain({
  id: CHAIN.id,
  name: CHAIN.name,
  nativeCurrency: CHAIN.nativeCurrency,
  rpcUrls: { default: { http: [CHAIN.rpcUrl] } },
  blockExplorers: { default: CHAIN.explorer },
  contracts: { multicall3: { address: CHAIN.multicall3 } },
});

export const PRICE_FEED_CHAIN_ID = PRICE_FEED.chainId;
export const PRICE_FEED_RPC_URL = PRICE_FEED.rpcUrl;
