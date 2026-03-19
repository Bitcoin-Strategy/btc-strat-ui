import {
  parseEventLogs,
  type Address,
  type PublicClient,
  type TransactionReceipt,
} from 'viem';

import { buildQuote } from './math';
import type { SwapQuote, SwapVenue } from './types';
import {
  buildUniversalRouterSwap,
  type UniversalRouterSwap,
} from './universal-router';

import { ERC20_ABI } from '../abi/erc20';
import {
  PERMIT2_ABI,
  UNIVERSAL_ROUTER_ABI,
  V4_QUOTER_ABI,
  V4_STATE_VIEW_ABI,
} from '../abi/uniswap-v4';

// Max uint160 / uint48: approved until revoked.
export const PERMIT2_MAX_AMOUNT = 2n ** 160n - 1n;
export const PERMIT2_MAX_EXPIRATION = 2 ** 48 - 1;

export type SwapDirection = {
  zeroForOne: boolean;
  currencyIn: Address;
  currencyOut: Address;
};

export const directionFor = (
  venue: SwapVenue,
  tokenIn: Address,
): SwapDirection => {
  const zeroForOne =
    tokenIn.toLowerCase() === venue.poolKey.currency0.toLowerCase();
  return {
    zeroForOne,
    currencyIn: zeroForOne ? venue.poolKey.currency0 : venue.poolKey.currency1,
    currencyOut: zeroForOne ? venue.poolKey.currency1 : venue.poolKey.currency0,
  };
};

// Shared by the preflight and the transaction so they cannot drift.
export const swapCall = (
  venue: SwapVenue,
  quote: SwapQuote,
  tokenIn: Address,
  deadline: bigint,
): UniversalRouterSwap => {
  const direction = directionFor(venue, tokenIn);
  return buildUniversalRouterSwap({
    venue,
    zeroForOne: direction.zeroForOne,
    amountIn: quote.amountIn,
    amountOutMinimum: quote.minAmountOut,
    currencyIn: direction.currencyIn,
    currencyOut: direction.currencyOut,
    deadline,
  });
};

/** Simulates right before signing so a failing swap never opens the wallet. The router enforces `minAmountOut` regardless. */
export async function preflightSwap(
  client: PublicClient,
  params: {
    venue: SwapVenue;
    quote: SwapQuote;
    tokenIn: Address;
    account: Address;
    deadline: bigint;
  },
): Promise<void> {
  const { venue, quote, tokenIn, account, deadline } = params;
  const call = swapCall(venue, quote, tokenIn, deadline);

  await client.simulateContract({
    account,
    address: venue.router,
    abi: UNIVERSAL_ROUTER_ABI,
    functionName: 'execute',
    args: [call.commands, call.inputs, call.deadline],
  });
}

const sumTransfers = (
  receipt: TransactionReceipt,
  token: Address,
  side: 'to' | 'from',
  party: Address,
): bigint => {
  const transfers = parseEventLogs({
    abi: ERC20_ABI,
    eventName: 'Transfer',
    logs: receipt.logs,
  });

  return transfers
    .filter(
      (log) =>
        log.address.toLowerCase() === token.toLowerCase() &&
        log.args[side].toLowerCase() === party.toLowerCase(),
    )
    .reduce((total, log) => total + log.args.value, 0n);
};

/** The bond uses this receipt amount, never the quote. */
export const receivedFromSwap = (
  receipt: TransactionReceipt,
  token: Address,
  recipient: Address,
): bigint => sumTransfers(receipt, token, 'to', recipient);

export const spentFromSwap = (
  receipt: TransactionReceipt,
  token: Address,
  payer: Address,
): bigint => sumTransfers(receipt, token, 'from', payer);

export async function readPermit2Allowances(
  client: PublicClient,
  params: { venue: SwapVenue; token: Address; owner: Address },
): Promise<{ erc20: bigint; router: bigint; expiration: number }> {
  const { venue, token, owner } = params;

  const [erc20, permit2] = await Promise.all([
    client.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, venue.permit2],
    }),
    client.readContract({
      address: venue.permit2,
      abi: PERMIT2_ABI,
      functionName: 'allowance',
      args: [owner, token, venue.router],
    }),
  ]);

  return { erc20, router: permit2[0], expiration: permit2[1] };
}

export type QuoteSwapParams = {
  venue: SwapVenue;
  amountIn: bigint;
  tokenIn: Address;
  decimalsIn: number;
  decimalsOut: number;
  slippageBps: number;
};

// Needs both the quoter output and the pool price to separate impact from fee.
export async function quoteSwap(
  client: PublicClient,
  params: QuoteSwapParams,
): Promise<SwapQuote> {
  const { venue, amountIn, tokenIn, decimalsIn, decimalsOut, slippageBps } =
    params;
  const { zeroForOne } = directionFor(venue, tokenIn);

  const [quoted, slot0] = await Promise.all([
    client.simulateContract({
      address: venue.quoter,
      abi: V4_QUOTER_ABI,
      functionName: 'quoteExactInputSingle',
      args: [
        {
          poolKey: venue.poolKey,
          zeroForOne,
          exactAmount: amountIn,
          hookData: '0x',
        },
      ],
    }),
    client.readContract({
      address: venue.stateView,
      abi: V4_STATE_VIEW_ABI,
      functionName: 'getSlot0',
      args: [venue.poolId],
    }),
  ]);

  const [amountOut] = quoted.result as readonly [bigint, bigint];
  const [sqrtPriceX96, , , lpFee] = slot0;

  return buildQuote({
    amountIn,
    amountOut,
    sqrtPriceX96,
    // Live fee: a dynamic-fee hook may have changed it.
    feePips: Number(lpFee) || venue.poolKey.fee,
    zeroForOne,
    slippageBps,
    decimalsIn,
    decimalsOut,
  });
}
