import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { useBtcUsd } from './use-btc-usd';
import { useEnsureProtocolChain } from './use-ensure-chain';
import { usePremiumBps } from './use-premium-bps';
import { useProtocolPrices } from './use-protocol-prices';

import { PREMIUM_SALES_ABI } from '../lib/abi/premium-sales';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';
import { notifyTransaction } from '../lib/notifications';
import {
  largestClearingSale,
  rewardFromBtcOut,
} from '../lib/premium-sale-size';
import { REFRESH } from '../lib/refresh';
import { btcToUsd, satToBtc, stratPriceToBtc, wadToNumber } from '../lib/units';

const REFRESH_MS = REFRESH.live;
const SIZE_REFRESH_MS = REFRESH.live;

// Everything else is re-checked on chain; this only stops a stale mempool tx.
const DEADLINE_SECONDS = 600n;

// ERC-20s refuse transfers to the zero address, so simulations need a real sender.
const PROBE_ACCOUNT = '0x000000000000000000000000000000000000dEaD' as const;

/** Sizes the sale by simulating descending amounts: the window and the pool depth are separate limits. */
export const usePremiumSale = () => {
  const { address, isConnected } = useAccount();
  const { btcUsd } = useBtcUsd();
  const client = usePublicClient({ chainId: PROTOCOL_CHAIN.id });

  // Reverts that `previewSale` flattens into `eligible: false`.
  const { oracleNotReady, noPremium } = usePremiumBps();
  // "Not ready" also covers zero NAV, which is the real state at launch.
  const { navBtc } = useProtocolPrices();

  const contract = {
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.PREMIUM_SALES,
    abi: PREMIUM_SALES_ABI,
  } as const;

  const { data: preview, refetch: refetchPreview } = useReadContract({
    ...contract,
    functionName: 'previewSale',
    query: { refetchInterval: REFRESH_MS },
  });

  const { data: windowState, refetch: refetchWindow } = useReadContract({
    ...contract,
    functionName: 'currentWindowState',
    query: { refetchInterval: REFRESH_MS },
  });

  const { data: rewardBps } = useReadContract({
    ...contract,
    functionName: 'saleRewardBps',
  });

  const { data: rewardCeiling } = useReadContract({
    ...contract,
    functionName: 'maxRewardBtc',
  });

  const eligible = preview?.eligible ?? false;
  const cap = preview?.maxSellNow ?? 0n;
  const probe = address ?? PROBE_ACCOUNT;

  // Query keys are JSON-hashed, so amounts are strings.
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  const { data: sized, isFetching: isSizing } = useQuery({
    queryKey: [
      'premium-sale-size',
      cap.toString(),
      preview?.premiumBps ?? 0,
      probe,
      client?.uid,
    ],
    enabled: eligible && !!client,
    refetchInterval: SIZE_REFRESH_MS,
    staleTime: SIZE_REFRESH_MS,
    retry: false,
    queryFn: async () => {
      if (!client) return null;
      const block = await client.getBlock();
      const deadline = block.timestamp + DEADLINE_SECONDS;

      return largestClearingSale(cap, async (size) => {
        try {
          const { result } = await client.simulateContract({
            ...contract,
            functionName: 'executePremiumSale',
            // No extra floor: the contract already enforces max(oracle price less slippage, NAV).
            args: [size, 0n, deadline],
            account: probe,
          });
          return result;
        } catch {
          return null;
        }
      });
    },
  });

  const ensureChain = useEnsureProtocolChain();
  const { writeContractAsync, isPending: isSigning } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [sendError, setSendError] = useState<Error | null>(null);

  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash, query: { enabled: !!hash } });

  const notified = useRef<string | null>(null);
  useEffect(() => {
    if (!isSuccess || !receipt || notified.current === receipt.transactionHash)
      return;
    notified.current = receipt.transactionHash;
    notifyTransaction.success(
      'premiumSale',
      receipt.transactionHash,
      'Premium sale executed — the reward is in your wallet',
    );
    void refetchPreview();
    void refetchWindow();
  }, [isSuccess, receipt, refetchPreview, refetchWindow]);

  const execute = async () => {
    if (!sized || !client) return;
    setSendError(null);
    try {
      await ensureChain();
      // Chain time, so a fast local clock cannot send an expired sale.
      const block = await client.getBlock();
      setHash(
        await writeContractAsync({
          ...contract,
          functionName: 'executePremiumSale',
          args: [sized.size, 0n, block.timestamp + DEADLINE_SECONDS],
        }),
      );
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Transaction failed');
      setSendError(error);
      notifyTransaction.error('premiumSale', error);
    }
  };

  const btcOut = sized?.btcOut ?? 0n;
  const rewardSat = rewardFromBtcOut(
    btcOut,
    rewardBps ?? 0,
    rewardCeiling ?? 0n,
  );
  const treasuryGetsBtc = satToBtc(btcOut);
  const rewardBtc = satToBtc(rewardSat);

  const reason = (() => {
    if (eligible) {
      if (isSizing || sized) return null;
      return 'The pool cannot clear a sale of any size at the moment. It reopens as liquidity comes back.';
    }
    if (navBtc === 0)
      return 'The Treasury holds no bitcoin yet, so STRAT has no backing to be priced above. Bonds are what put it there.';
    if (oracleNotReady)
      return 'The pool has less price history than the oracle window needs, so nothing can be priced yet.';
    if (noPremium || preview?.premiumBps === 0)
      return 'STRAT trades at or below its backing. Selling here would hand the market bitcoin, so the contract refuses.';
    if (preview?.windowCap === 0n)
      return 'No band covers the current premium, so this window has no allowance.';
    if (preview?.remainingInWindow === 0n)
      return "This window's allowance is already sold. It resets when the next one opens.";
    if (preview?.maxSellNow === 0n)
      return 'The premium reserve is empty — there is no STRAT left to sell.';
    return 'No sale is available right now.';
  })();

  return {
    eligible,
    reason,

    premiumPct: preview ? preview.premiumBps / 100 : null,
    bandIndex: preview ? Number(preview.bandIndex) : null,
    navBtcPerStrat: preview ? stratPriceToBtc(preview.navBtcPerStrat) : 0,
    marketBtcPerStrat: preview ? stratPriceToBtc(preview.priceBtcPerStrat) : 0,

    sellsStrat: sized ? wadToNumber(sized.size) : 0,
    treasuryGetsBtc,
    treasuryGetsUsd: btcToUsd(treasuryGetsBtc, btcUsd),
    rewardBtc,
    rewardUsd: btcToUsd(rewardBtc, btcUsd),
    // True when pool depth, not the window, caps the size.
    limitedByLiquidity: sized?.limitedByLiquidity ?? false,

    allowedThisWindowStrat: preview ? wadToNumber(preview.maxSellNow) : 0,
    windowCapStrat: windowState ? wadToNumber(windowState.windowCap) : 0,
    soldThisWindowStrat: windowState
      ? wadToNumber(windowState.soldThisWindow)
      : 0,
    windowEndsAt: windowState
      ? windowState.windowStart + windowState.windowLength
      : null,

    execute,
    isConnected,
    isSizing,
    isProcessing: isSigning || isConfirming,
    hash,
    error: sendError,
    canExecute: !!sized && isConnected && !isSigning && !isConfirming,
  };
};
