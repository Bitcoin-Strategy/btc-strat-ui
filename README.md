# BTC Strategy UI

Web app for the BTC Strategy protocol on Robinhood Chain: dashboard, bonding, vesting, staking and redemption, governance, and the Genesis admin panel.

Built with React, Vite, wagmi, viem, TanStack Query and Tailwind CSS.

## Getting started

Requires Node.js 24 (see `.node-version`).

```bash
npm install
npm run dev
```

The app needs no environment variables. The target deployment, RPC and subgraph are defined in [`src/config/index.ts`](src/config/index.ts).

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and build for production |
| `npm run lint` | ESLint |
| `npm run test:unit` | Unit tests |
| `npm run test:build` | Build and config consistency checks |
| `npm run test:smoke` | Playwright smoke tests |

## Updating contracts

Point the sync scripts at a checkout of the contracts repository:

```bash
npm run sync:config -- <contracts-repo>/deployments/robinhood.json   # addresses
npm run sync:abi -- <contracts-repo>                                  # ABIs
```

## Deployment

`npm run build` outputs a static bundle to `dist/`, served as a single-page app (see `wrangler.jsonc`).

## License

[MIT](LICENSE)
