import { encodeAbiParameters, keccak256 } from 'viem';

import type { BondPaymentAsset, PoolKey, SwapVenue } from './types';

import { SWAP } from '../../config';
import { POOL_KEY_COMPONENTS } from '../abi/uniswap-v4';
import { ADDRESSES } from '../addresses';

/** The USDG to cbBTC route before a bond. Verify a new `SWAP` with `npm run check:venue:*` in the contracts repo. */

const poolIdOf = (key: PoolKey): `0x${string}` =>
  keccak256(
    encodeAbiParameters(
      [{ type: 'tuple', components: POOL_KEY_COMPONENTS }],
      [key],
    ),
  );

// PoolKey currencies are sorted by address.
const sortCurrencies = (
  a: `0x${string}`,
  b: `0x${string}`,
): [`0x${string}`, `0x${string}`] =>
  a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];

const buildVenue = (route: NonNullable<typeof SWAP>): SwapVenue => {
  const [currency0, currency1] = sortCurrencies(ADDRESSES.BTC, route.usdg);

  const poolKey: PoolKey = {
    currency0,
    currency1,
    fee: route.pool.fee,
    tickSpacing: route.pool.tickSpacing,
    hooks: route.pool.hooks,
  };

  return {
    kind: 'uniswap-v4',
    label: route.venueLabel ?? 'Uniswap v4',
    router: route.router,
    permit2: route.permit2,
    quoter: route.quoter,
    stateView: route.stateView,
    poolId: poolIdOf(poolKey),
    poolKey,
    actionLayout: route.actionLayout,
  };
};

export const BTC_USDG_VENUE: SwapVenue | undefined = SWAP
  ? buildVenue(SWAP)
  : undefined;

/** cbBTC first: it is the only asset the protocol takes. Symbols and decimals are first-render fallbacks. */
export const BOND_PAYMENT_ASSETS: readonly BondPaymentAsset[] = [
  {
    id: 'btc',
    address: ADDRESSES.BTC,
    symbol: 'cbBTC',
    decimals: 8,
    route: { kind: 'direct' },
  },
  ...(SWAP && BTC_USDG_VENUE
    ? [
        {
          id: 'usdg',
          address: SWAP.usdg,
          symbol: SWAP.assetSymbol ?? 'USDG',
          decimals: 6,
          route: {
            kind: 'swap',
            venue: BTC_USDG_VENUE,
            to: ADDRESSES.BTC,
          },
        } satisfies BondPaymentAsset,
      ]
    : []),
];

export const paymentAssetById = (id: string): BondPaymentAsset =>
  BOND_PAYMENT_ASSETS.find((asset) => asset.id === id) ??
  BOND_PAYMENT_ASSETS[0];

export const venueFor = (asset: BondPaymentAsset): SwapVenue | undefined =>
  asset.route.kind === 'swap' ? asset.route.venue : undefined;
