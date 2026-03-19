import { encodeAbiParameters, encodePacked, type Hex } from 'viem';

import type { SwapVenue, V4ActionLayout } from './types';

import { POOL_KEY_COMPONENTS } from '../abi/uniswap-v4';

/** One `V4_SWAP` command: swap exact in, settle all, take all, each with its own bound. */

const V4_SWAP = 0x10;

const SWAP_EXACT_IN_SINGLE = 0x06;
const SETTLE_ALL = 0x0c;
const TAKE_ALL = 0x0f;

// Zero means the router's widest bound; `amountOutMinimum` is the real guarantee.
const NO_PRICE_LIMIT = 0n;

const EXACT_IN_SINGLE = {
  'with-price-limit': [
    {
      type: 'tuple',
      components: [
        { name: 'poolKey', type: 'tuple', components: POOL_KEY_COMPONENTS },
        { name: 'zeroForOne', type: 'bool' },
        { name: 'amountIn', type: 'uint128' },
        { name: 'amountOutMinimum', type: 'uint128' },
        { name: 'sqrtPriceLimitX96', type: 'uint160' },
        { name: 'hookData', type: 'bytes' },
      ],
    },
  ],
  'without-price-limit': [
    {
      type: 'tuple',
      components: [
        { name: 'poolKey', type: 'tuple', components: POOL_KEY_COMPONENTS },
        { name: 'zeroForOne', type: 'bool' },
        { name: 'amountIn', type: 'uint128' },
        { name: 'amountOutMinimum', type: 'uint128' },
        { name: 'hookData', type: 'bytes' },
      ],
    },
  ],
} as const satisfies Record<V4ActionLayout, unknown>;

const CURRENCY_AND_AMOUNT = [{ type: 'address' }, { type: 'uint256' }] as const;

const encodeSwapAction = (params: {
  layout: V4ActionLayout;
  venue: SwapVenue;
  zeroForOne: boolean;
  amountIn: bigint;
  amountOutMinimum: bigint;
}): Hex => {
  const { layout, venue, zeroForOne, amountIn, amountOutMinimum } = params;
  const common = {
    poolKey: venue.poolKey,
    zeroForOne,
    amountIn,
    amountOutMinimum,
    hookData: '0x' as Hex,
  };

  return layout === 'with-price-limit'
    ? encodeAbiParameters(EXACT_IN_SINGLE['with-price-limit'], [
        { ...common, sqrtPriceLimitX96: NO_PRICE_LIMIT },
      ])
    : encodeAbiParameters(EXACT_IN_SINGLE['without-price-limit'], [common]);
};

export type UniversalRouterSwap = {
  commands: Hex;
  inputs: readonly Hex[];
  deadline: bigint;
};

export const buildUniversalRouterSwap = (params: {
  venue: SwapVenue;
  zeroForOne: boolean;
  amountIn: bigint;
  amountOutMinimum: bigint;
  currencyIn: `0x${string}`;
  currencyOut: `0x${string}`;
  deadline: bigint;
}): UniversalRouterSwap => {
  const {
    venue,
    amountIn,
    amountOutMinimum,
    currencyIn,
    currencyOut,
    deadline,
  } = params;

  const actions = encodePacked(
    ['uint8', 'uint8', 'uint8'],
    [SWAP_EXACT_IN_SINGLE, SETTLE_ALL, TAKE_ALL],
  );

  const actionParams = [
    encodeSwapAction({
      layout: venue.actionLayout,
      venue,
      zeroForOne: params.zeroForOne,
      amountIn,
      amountOutMinimum,
    }),
    encodeAbiParameters(CURRENCY_AND_AMOUNT, [currencyIn, amountIn]),
    encodeAbiParameters(CURRENCY_AND_AMOUNT, [currencyOut, amountOutMinimum]),
  ];

  return {
    commands: encodePacked(['uint8'], [V4_SWAP]),
    inputs: [
      encodeAbiParameters(
        [{ type: 'bytes' }, { type: 'bytes[]' }],
        [actions, actionParams],
      ),
    ],
    deadline,
  };
};
