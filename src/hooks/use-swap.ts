import { useCallback, useState } from 'react';
import { useConnection, usePublicClient, useWriteContract } from 'wagmi';

import { useEnsureProtocolChain } from './use-ensure-chain';

import { UNIVERSAL_ROUTER_ABI } from '../lib/abi/uniswap-v4';
import { PROTOCOL_CHAIN } from '../lib/chains';
import {
  preflightSwap,
  receivedFromSwap,
  spentFromSwap,
  swapCall,
  type SwapQuote,
  type SwapVenue,
} from '../lib/swap';

export type SwapResult = {
  hash: `0x${string}`;
  // From the receipt, not the quote.
  received: bigint;
  spent: bigint;
};

type UseSwapParams = {
  venue: SwapVenue | undefined;
  tokenIn: `0x${string}` | undefined;
  tokenOut: `0x${string}` | undefined;
  deadlineMinutes: number;
  onSuccess?: (result: SwapResult) => void;
};

/** Switch chain, simulate, send, then read the received amount from the receipt. */
export const useSwap = ({
  venue,
  tokenIn,
  tokenOut,
  deadlineMinutes,
  onSuccess,
}: UseSwapParams) => {
  const { address } = useConnection();
  const client = usePublicClient({ chainId: PROTOCOL_CHAIN.id });
  const ensureChain = useEnsureProtocolChain();
  const { writeContractAsync } = useWriteContract();

  const [isSwapping, setIsSwapping] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const swap = useCallback(
    async (quote: SwapQuote): Promise<SwapResult | null> => {
      if (!venue || !tokenIn || !tokenOut || !address || !client) return null;

      setError(null);
      setIsSwapping(true);
      setHash(undefined);

      try {
        await ensureChain();

        const deadline =
          BigInt(Math.floor(Date.now() / 1000)) +
          BigInt(Math.max(1, Math.round(deadlineMinutes)) * 60);
        const call = swapCall(venue, quote, tokenIn, deadline);

        await preflightSwap(client, {
          venue,
          quote,
          tokenIn,
          account: address,
          deadline,
        });

        const txHash = await writeContractAsync({
          chainId: PROTOCOL_CHAIN.id,
          address: venue.router,
          abi: UNIVERSAL_ROUTER_ABI,
          functionName: 'execute',
          args: [call.commands, call.inputs, call.deadline],
        });
        setHash(txHash);

        const receipt = await client.waitForTransactionReceipt({
          hash: txHash,
        });
        if (receipt.status !== 'success') {
          throw new Error('The swap transaction reverted.');
        }

        const received = receivedFromSwap(receipt, tokenOut, address);
        if (received === 0n) {
          // A successful router swap cannot pay out zero, so the receipt is suspect.
          throw new Error(
            'The swap confirmed but no tokens arrived. Check the transaction before bonding.',
          );
        }

        const result: SwapResult = {
          hash: txHash,
          received,
          spent: spentFromSwap(receipt, tokenIn, address),
        };
        onSuccess?.(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('The swap failed.'));
        return null;
      } finally {
        setIsSwapping(false);
      }
    },
    [
      venue,
      tokenIn,
      tokenOut,
      deadlineMinutes,
      address,
      client,
      ensureChain,
      writeContractAsync,
      onSuccess,
    ],
  );

  const reset = useCallback(() => {
    setHash(undefined);
    setError(null);
  }, []);

  return { swap, isSwapping, hash, error, reset };
};
