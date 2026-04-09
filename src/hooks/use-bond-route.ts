import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseUnits } from 'viem';
import { useConnection } from 'wagmi';

import { useApproveToken } from './use-approve-token';
import { useBond } from './use-bond';
import { useBondPreview } from './use-bond-preview';
import { useDebouncedValue } from './use-debounced-value';
import { usePermit2 } from './use-permit2';
import { useSwap, type SwapResult } from './use-swap';
import { useSwapQuote } from './use-swap-quote';

import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';
import { notifyTransaction } from '../lib/notifications';
import {
  clearPendingSwap,
  loadPendingSwap,
  savePendingSwap,
  venueFor,
  type BondPaymentAsset,
  type PendingBondSwap,
} from '../lib/swap';

export type RouteStepId =
  'approve-permit2' | 'allow-router' | 'swap' | 'approve-bond' | 'bond';

export type RouteStepStatus = 'todo' | 'active' | 'done';

export type RouteStep = {
  id: RouteStepId;
  label: string;
  status: RouteStepStatus;
  oneTime: boolean;
  hash?: `0x${string}`;
};

type UseBondRouteParams = {
  seriesId: string;
  asset: BondPaymentAsset;
  assetDecimals: number;
  assetSymbol: string;
  amount: string;
  btcDecimals: number;
  btcSymbol: string;
  btcBalance?: bigint;
  slippageBps: number;
  deadlineMinutes: number;
  onBonded?: () => void;
};

const STEP = {
  approvePermit2: 'approve-permit2',
  allowRouter: 'allow-router',
  swap: 'swap',
  approveBond: 'approve-bond',
  bond: 'bond',
} as const satisfies Record<string, RouteStepId>;

// Ordered: everything before the active step has happened.
const STEP_ORDER: RouteStepId[] = [
  STEP.approvePermit2,
  STEP.allowRouter,
  STEP.swap,
  STEP.approveBond,
  STEP.bond,
];

const ignore = () => {};

const parseAmount = (value: string, decimals: number): bigint | undefined => {
  if (!value || Number.isNaN(Number(value)) || Number(value) <= 0)
    return undefined;
  try {
    return parseUnits(value, decimals);
  } catch {
    return undefined;
  }
};

/**
 * Bond from cbBTC (approve + bond) or a stablecoin (swap through Permit2 first).
 * The bond uses the amount from the swap receipt, never the quote, and a landed swap is persisted so a refresh resumes at the bond.
 */
export const useBondRoute = ({
  seriesId,
  asset,
  assetDecimals,
  assetSymbol,
  amount,
  btcDecimals,
  btcSymbol,
  btcBalance,
  slippageBps,
  deadlineMinutes,
  onBonded,
}: UseBondRouteParams) => {
  const { address } = useConnection();
  const venue = venueFor(asset);
  const isSwapRoute = !!venue;

  const [pending, setPending] = useState<PendingBondSwap | null>(() =>
    loadPendingSwap(PROTOCOL_CHAIN.id, address),
  );

  const [pendingAccount, setPendingAccount] = useState(address);
  if (pendingAccount !== address) {
    setPendingAccount(address);
    setPending(loadPendingSwap(PROTOCOL_CHAIN.id, address));
  }

  const pendingRaw = pending ? BigInt(pending.amountRaw) : undefined;

  // The remembered cbBTC may have been spent since; show the shortfall.
  const pendingShortfall =
    pendingRaw !== undefined &&
    btcBalance !== undefined &&
    btcBalance < pendingRaw;

  const amountInRaw = useMemo(
    () => parseAmount(amount, assetDecimals),
    [amount, assetDecimals],
  );
  const debouncedAmountIn = useDebouncedValue(amountInRaw);

  const {
    quote,
    isLoading: isQuoting,
    error: quoteError,
    refetch: refetchQuote,
    updatedAt: quotedAt,
  } = useSwapQuote({
    venue,
    amountIn: debouncedAmountIn,
    tokenIn: asset.address,
    decimalsIn: assetDecimals,
    decimalsOut: btcDecimals,
    slippageBps,
    enabled: isSwapRoute && !pending,
  });

  // Settled after the swap, a projection before it.
  const bondAmountRaw = useMemo(() => {
    if (pendingRaw !== undefined) {
      return pendingShortfall ? btcBalance : pendingRaw;
    }
    return isSwapRoute ? quote?.amountOut : amountInRaw;
  }, [
    pendingRaw,
    pendingShortfall,
    btcBalance,
    isSwapRoute,
    quote?.amountOut,
    amountInRaw,
  ]);

  const bondAmountIsSettled = !isSwapRoute || pendingRaw !== undefined;

  const permit2 = usePermit2({
    venue,
    token: isSwapRoute ? asset.address : undefined,
    amount: pending ? undefined : amountInRaw,
  });

  const bondApproval = useApproveToken({
    tokenAddress: ADDRESSES.BTC,
    spenderAddress: ADDRESSES.BONDING,
    amountRaw: bondAmountRaw,
  });

  const onSwapped = useCallback(
    (result: SwapResult) => {
      if (!address) return;
      const record: PendingBondSwap = {
        chainId: PROTOCOL_CHAIN.id,
        account: address,
        seriesId,
        amountRaw: result.received.toString(),
        swapHash: result.hash,
        at: Date.now(),
      };
      savePendingSwap(record);
      setPending(record);
      notifyTransaction.success(
        'swap',
        result.hash,
        `Swapped for ${btcSymbol}. One more transaction to bond it.`,
      );
    },
    [address, seriesId, btcSymbol],
  );

  const {
    swap,
    isSwapping,
    hash: swapHash,
    error: swapError,
    reset: resetSwap,
  } = useSwap({
    venue,
    tokenIn: asset.address,
    tokenOut: ADDRESSES.BTC,
    deadlineMinutes,
    onSuccess: onSwapped,
  });

  // Also the bond floor, so the screen and the bond must use the same number.
  const { vvestOut: stratOut, isLoading: isPreviewLoading } = useBondPreview({
    seriesId,
    amountRaw: bondAmountRaw,
  });

  const {
    bond,
    isPending: isBonding,
    isConfirming: isBondConfirming,
    isSuccess: isBondSuccess,
    hash: bondHash,
    error: bondError,
    reset: resetBond,
  } = useBond({
    seriesId,
    amountRaw: bondAmountIsSettled ? bondAmountRaw : undefined,
    tokenAddress: ADDRESSES.BTC,
    enabled: bondAmountIsSettled,
    minStratOut: stratOut,
  });

  const bondNotified = useRef(false);

  const { isSuccess: bondApproved, refetchAllowance: refetchBondAllowance } =
    bondApproval;

  useEffect(() => {
    if (bondApproved) refetchBondAllowance().catch(ignore);
  }, [bondApproved, refetchBondAllowance]);

  useEffect(() => {
    if (!isBondSuccess || bondNotified.current) return;
    bondNotified.current = true;
    clearPendingSwap(PROTOCOL_CHAIN.id, address);
    setPending(null);
    notifyTransaction.success(
      'bond',
      bondHash,
      'Bonded. Your VVEST is vesting.',
    );
    onBonded?.();
  }, [isBondSuccess, bondHash, address, onBonded]);

  useEffect(() => {
    if (swapError) notifyTransaction.error('swap', swapError);
  }, [swapError]);

  useEffect(() => {
    if (bondError) notifyTransaction.error('bond', bondError);
  }, [bondError]);

  // A changed amount, asset or series starts a new route; the remembered swap survives.
  useEffect(() => {
    resetBond();
    resetSwap();
    bondNotified.current = false;
  }, [amount, asset.id, seriesId, resetBond, resetSwap]);

  const needsPermit2Approval =
    isSwapRoute && !pending && permit2.needsTokenApproval;
  const needsRouterAllowance =
    isSwapRoute && !pending && permit2.needsRouterAllowance;
  const needsBondApproval = bondApproval.needsApproval;

  const activeStepId: RouteStepId = (() => {
    if (needsPermit2Approval) return STEP.approvePermit2;
    if (needsRouterAllowance) return STEP.allowRouter;
    if (isSwapRoute && !pending) return STEP.swap;
    if (needsBondApproval) return STEP.approveBond;
    return STEP.bond;
  })();

  const isProcessing =
    permit2.isApproving ||
    bondApproval.isPending ||
    bondApproval.isConfirming ||
    isSwapping ||
    isBonding ||
    isBondConfirming;

  const next = useCallback(async () => {
    if (needsPermit2Approval) return permit2.approveToken();
    if (needsRouterAllowance) return permit2.allowRouter();
    if (isSwapRoute && !pending) {
      if (quote) await swap(quote);
      return;
    }
    if (needsBondApproval) return bondApproval.approve();
    return bond();
  }, [
    needsPermit2Approval,
    needsRouterAllowance,
    needsBondApproval,
    isSwapRoute,
    pending,
    permit2,
    bondApproval,
    quote,
    swap,
    bond,
  ]);

  const execute = useCallback(() => {
    next().catch(ignore);
  }, [next]);

  const discardPending = useCallback(() => {
    clearPendingSwap(PROTOCOL_CHAIN.id, address);
    setPending(null);
  }, [address]);

  const steps = useMemo<RouteStep[]>(() => {
    const active = STEP_ORDER.indexOf(activeStepId);
    const statusOf = (id: RouteStepId): RouteStepStatus => {
      if (isBondSuccess) return 'done';
      const index = STEP_ORDER.indexOf(id);
      if (index < active) return 'done';
      return index === active ? 'active' : 'todo';
    };

    const list: RouteStep[] = [];

    if (isSwapRoute) {
      if (needsPermit2Approval) {
        list.push({
          id: STEP.approvePermit2,
          label: `Approve ${assetSymbol}`,
          status: statusOf(STEP.approvePermit2),
          oneTime: true,
        });
      }
      if (needsRouterAllowance) {
        list.push({
          id: STEP.allowRouter,
          label: 'Allow router',
          status: statusOf(STEP.allowRouter),
          oneTime: true,
        });
      }
      list.push({
        id: STEP.swap,
        label: `Swap to ${btcSymbol}`,
        status: statusOf(STEP.swap),
        oneTime: false,
        hash: pending?.swapHash ?? swapHash,
      });
    }

    if (needsBondApproval || bondApproved) {
      list.push({
        id: STEP.approveBond,
        label: `Approve ${btcSymbol}`,
        status: statusOf(STEP.approveBond),
        oneTime: true,
        hash: bondApproval.hash,
      });
    }

    list.push({
      id: STEP.bond,
      label: 'Bond',
      status: statusOf(STEP.bond),
      oneTime: false,
      hash: bondHash,
    });

    return list;
  }, [
    activeStepId,
    isSwapRoute,
    pending,
    needsPermit2Approval,
    needsRouterAllowance,
    needsBondApproval,
    bondApproved,
    bondApproval.hash,
    assetSymbol,
    btcSymbol,
    swapHash,
    isBondSuccess,
    bondHash,
  ]);

  const oneTimeStepsRemaining = steps.filter(
    (step) => step.oneTime && step.status !== 'done',
  ).length;

  const waitingText = () => {
    if (permit2.approvingStep === 'token') return `Approving ${assetSymbol}…`;
    if (permit2.approvingStep === 'router') return 'Allowing router…';
    if (bondApproval.isPending || isBonding) return 'Confirm in wallet…';
    if (bondApproval.isConfirming) return `Approving ${btcSymbol}…`;
    if (isSwapping) return 'Swapping…';
    return 'Bonding…';
  };

  const buttonText = useMemo(() => {
    if (isProcessing) return waitingText();
    if (isBondSuccess) return 'Bonded';
    if (activeStepId === STEP.approvePermit2) return `Approve ${assetSymbol}`;
    if (activeStepId === STEP.allowRouter) return 'Allow router';
    if (activeStepId === STEP.swap) return 'Swap';
    if (activeStepId === STEP.approveBond) return `Approve ${btcSymbol}`;
    return pending ? 'Finish bond' : 'Bond';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isProcessing,
    permit2.approvingStep,
    bondApproval.isPending,
    bondApproval.isConfirming,
    isSwapping,
    isBonding,
    isBondSuccess,
    activeStepId,
    assetSymbol,
    btcSymbol,
    pending,
  ]);

  // Nothing is signed on a forecast.
  const isActionable = (() => {
    if (
      activeStepId === STEP.approvePermit2 ||
      activeStepId === STEP.allowRouter
    ) {
      return !!amountInRaw;
    }
    if (activeStepId === STEP.swap)
      return !!amountInRaw && !!quote && !quoteError;
    return (
      !!bondAmountRaw &&
      bondAmountRaw > 0n &&
      (needsBondApproval || (!isPreviewLoading && !!stratOut))
    );
  })();

  return {
    quote,
    isQuoting,
    quoteError,
    refetchQuote,
    quotedAt,

    bondAmountRaw,
    bondAmountIsSettled,

    stratOut,
    isPreviewLoading,

    pending,
    pendingRaw,
    pendingShortfall,
    discardPending,

    steps,
    oneTimeStepsRemaining,
    activeStepId,
    execute,
    buttonText,
    isProcessing,
    isBondSuccess,
    canExecute: !!address && isActionable && !isProcessing && !isBondSuccess,
    error:
      permit2.error ?? swapError ?? bondApproval.error ?? bondError ?? null,
  };
};
