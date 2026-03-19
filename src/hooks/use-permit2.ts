import { useCallback, useState } from 'react';
import { maxUint256 } from 'viem';
import {
  useConnection,
  usePublicClient,
  useReadContracts,
  useWriteContract,
} from 'wagmi';

import { useEnsureProtocolChain } from './use-ensure-chain';
import { useNow } from './use-now';

import { ERC20_ABI } from '../lib/abi/erc20';
import { PERMIT2_ABI } from '../lib/abi/uniswap-v4';
import { PROTOCOL_CHAIN } from '../lib/chains';
import {
  PERMIT2_MAX_AMOUNT,
  PERMIT2_MAX_EXPIRATION,
  type SwapVenue,
} from '../lib/swap';

/** Token approval for Permit2 plus Permit2 allowance for the router, as plain transactions rather than a signed permit. */
export const usePermit2 = ({
  venue,
  token,
  amount,
}: {
  venue: SwapVenue | undefined;
  token: `0x${string}` | undefined;
  amount: bigint | undefined;
}) => {
  const { address } = useConnection();
  const client = usePublicClient({ chainId: PROTOCOL_CHAIN.id });
  const ensureChain = useEnsureProtocolChain();
  const { writeContractAsync } = useWriteContract();

  const [step, setStep] = useState<'token' | 'router' | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const enabled = !!venue && !!token && !!address;

  const { data, refetch } = useReadContracts({
    contracts: enabled
      ? [
          {
            chainId: PROTOCOL_CHAIN.id,
            address: token,
            abi: ERC20_ABI,
            functionName: 'allowance' as const,
            args: [address, venue.permit2] as const,
          },
          {
            chainId: PROTOCOL_CHAIN.id,
            address: venue.permit2,
            abi: PERMIT2_ABI,
            functionName: 'allowance' as const,
            args: [address, token, venue.router] as const,
          },
        ]
      : [],
    query: { enabled },
  });

  const tokenAllowance =
    data?.[0]?.status === 'success' ? (data[0].result as bigint) : undefined;
  const routerAllowance =
    data?.[1]?.status === 'success'
      ? (data[1].result as readonly [bigint, number, number])
      : undefined;

  const nowSeconds = Math.floor(useNow() / 1000);

  const needsTokenApproval =
    amount !== undefined &&
    tokenAllowance !== undefined &&
    tokenAllowance < amount;

  const needsRouterAllowance =
    amount !== undefined &&
    routerAllowance !== undefined &&
    (routerAllowance[0] < amount || routerAllowance[1] <= nowSeconds);

  const isFirstTime = needsTokenApproval || needsRouterAllowance;

  const run = useCallback(
    async (which: 'token' | 'router') => {
      if (!venue || !token || !address || !client) return;
      setError(null);
      setStep(which);
      try {
        await ensureChain();
        const hash =
          which === 'token'
            ? await writeContractAsync({
                chainId: PROTOCOL_CHAIN.id,
                address: token,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [venue.permit2, maxUint256],
              })
            : await writeContractAsync({
                chainId: PROTOCOL_CHAIN.id,
                address: venue.permit2,
                abi: PERMIT2_ABI,
                functionName: 'approve',
                args: [
                  token,
                  venue.router,
                  PERMIT2_MAX_AMOUNT,
                  PERMIT2_MAX_EXPIRATION,
                ],
              });
        await client.waitForTransactionReceipt({ hash });
        await refetch();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Approval failed.'));
      } finally {
        setStep(null);
      }
    },
    [venue, token, address, client, ensureChain, writeContractAsync, refetch],
  );

  const approveToken = useCallback(() => run('token'), [run]);
  const allowRouter = useCallback(() => run('router'), [run]);

  return {
    needsTokenApproval,
    needsRouterAllowance,
    isFirstTime,
    isApproving: step !== null,
    approvingStep: step,
    approveToken,
    allowRouter,
    error,
    refetch,
  };
};
