/** The deployment this app talks to. Regenerate the marked block with `npm run sync:config`. */

// Chainlink BTC/USD on Ethereum; Robinhood Chain has no feed. Display only.
export const PRICE_FEED = {
  chainId: 1,
  rpcUrl: 'https://ethereum-rpc.publicnode.com',
} as const;

export const CHAIN = {
  id: 4663,
  name: 'Robinhood Chain',
  // Public and rate-limited.
  rpcUrl: 'https://rpc.mainnet.chain.robinhood.com',
  explorer: {
    name: 'Robinhood Explorer',
    url: 'https://robinhoodchain.blockscout.com',
  },
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  // viem needs Multicall3 to batch reads.
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
} as const;

// Tagged, so a new subgraph release is a retag, not a rebuild.
export const SUBGRAPH = {
  url: 'https://api.goldsky.com/api/public/project_cmp4213fdupdk01zh59u6dv3f/subgraphs/btc/prod/gn',
  pollingMs: 180_000,
} as const;

/** USDG to cbBTC swap before a bond. `undefined` offers cbBTC only. Set all of it or none. */
export const SWAP:
  | {
      readonly usdg: `0x${string}`;
      readonly router: `0x${string}`;
      readonly permit2: `0x${string}`;
      readonly quoter: `0x${string}`;
      readonly stateView: `0x${string}`;
      readonly pool: {
        readonly fee: number;
        readonly tickSpacing: number;
        readonly hooks: `0x${string}`;
      };
      // v4 action structs differ between periphery versions; `npm run check:venue:*` tells which.
      readonly actionLayout: 'with-price-limit' | 'without-price-limit';
      readonly assetSymbol: string;
      readonly venueLabel: string;
    }
  | undefined = undefined;

// ── generated from the deployment file: npm run sync:config ────────────────────────────────
export const ADDRESSES = {
  BTC: '0xcec185eb182c47d1ba1efc84e6959e18cd620be4',
  STRAT: '0xab63c1817415cc566cddf03c387dcc750af6427f',
  VVEST: '0x95066e6947cf26e9b91bc5a0fb1025557f33df64',

  TREASURY: '0x4a6c9f1b41d9c77f14600c85bcb92c984642444a',
  STAKING: '0x9d335c4b63ceda13b587720f8efc494a795b43af',
  VESTING: '0x5dd0c83420f8f516dbf933567251c4577c8d4b06',
  BONDING: '0x1700c0dc81b5d1e6a8ce83efbf5ab7f9c67f2eee',
  REDEMPTION: '0xb67d5b58b38381d6fdf6e6aadfe16b332419dae3',
  PREMIUM_SALES: '0x11be47a430383f64f389020927963009f688e2b7',
  FEE_VAULT: '0xcc0b98472878ec8b305b5e897cca95f3ccde8306',
  PROTOCOL_READER: '0x5af55d67d0e7ac5720dfe1e514d827cb9ca7079f',

  AUTHORITY: '0x83c939b7f683f48bb6a408f5cd15df212adbe70e',
  PARAMS_TIMELOCK: '0x5349f9c5e3083e3b3acd533afdbcb2532fc0a9e0',
  UPGRADE_TIMELOCK: '0x141b76dcb8d290b78d7564181ad84b369aa053f9',
  PARAMS_GOVERNOR: '0x52e748423dc234754d03f3fee266271d6ecce1ce',
  UPGRADE_GOVERNOR: '0xa06ad1b3a80717b51153bd51f882e061fa6ac2de',

  PROTOCOL_ORACLE: '0xba50c14fa57b9f6b8e85bb10054c3fe1d60d30d4',
  STRAT_BTC_ADAPTER: '0x228811cc56add980e989e71366776ed9df4fa1bc',
  POOL_HOOK: '0x8b03bed3f9d6848b6d525d5cf34a360c581930c4',
  POOL_MANAGER: '0x8366a39cc670b4001a1121b8f6a443a643e40951',
} as const satisfies Record<string, `0x${string}`>;

/// The one pool: STRAT priced in cbBTC, with the protocol's own hook attached.
export const STRAT_BTC_POOL_ID =
  '0xd1dc21198848c530e5dcfb20d3577b2fa84382e9fcd7a220718cee67d68d0111' as const;

/// Where log queries start, instead of at genesis.
export const DEPLOY_BLOCK = 86651208n;
// ── end generated ──────────────────────────────────────────────────────────────────────────
