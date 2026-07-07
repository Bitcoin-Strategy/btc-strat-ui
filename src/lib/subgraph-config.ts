import { SUBGRAPH } from '../config';

export const SUBGRAPH_CONFIG = {
  url: SUBGRAPH.url,
  polling: {
    interval: SUBGRAPH.pollingMs,
    pageSize: 1000,
    maxPages: 100,
  },
} as const;
