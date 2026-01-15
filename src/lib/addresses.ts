import { PROTOCOL_CHAIN } from './chains';

export { ADDRESSES, DEPLOY_BLOCK, STRAT_BTC_POOL_ID } from '../config';

export const explorerAddress = (address: string) =>
  `${PROTOCOL_CHAIN.blockExplorers.default.url}/address/${address}`;

export const explorerTx = (hash: string) =>
  `${PROTOCOL_CHAIN.blockExplorers.default.url}/tx/${hash}`;
