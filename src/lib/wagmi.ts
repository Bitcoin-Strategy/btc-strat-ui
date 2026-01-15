import { createConfig, createStorage, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

import {
  PRICE_FEED_CHAIN_ID,
  PRICE_FEED_RPC_URL,
  PROTOCOL_CHAIN,
} from './chains';

// Read-only.
const priceFeedChain =
  PRICE_FEED_CHAIN_ID === mainnet.id
    ? mainnet
    : { ...mainnet, id: PRICE_FEED_CHAIN_ID };

/** Batches JSON-RPC requests per render, including calls multicall cannot fold (`eth_getLogs`, `eth_getBalance`). */
const batched = (url: string) =>
  http(url, { batch: { wait: 16, batchSize: 50 } });

/** The protocol chain for everything; Ethereum only for the BTC/USD feed. */
export const getWagmiConfig = () =>
  createConfig({
    chains: [PROTOCOL_CHAIN, priceFeedChain],
    storage: createStorage({
      storage: typeof window !== 'undefined' ? localStorage : undefined,
    }),
    connectors: [metaMask(), injected()],
    ssr: true,
    transports: {
      [PROTOCOL_CHAIN.id]: batched(PROTOCOL_CHAIN.rpcUrls.default.http[0]),
      [priceFeedChain.id]: batched(PRICE_FEED_RPC_URL),
    },
  });
