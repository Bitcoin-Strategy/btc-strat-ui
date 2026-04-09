import { ArrowDown, Info } from 'lucide-react';
import { useState } from 'react';
import { formatUnits, parseUnits } from 'viem';

import { PayWith } from './pay-with';
import { PendingSwapBanner } from './pending-swap-banner';
import { RouteSteps } from './route-steps';
import { RouteSummary } from './route-summary';
import { SetupDialog } from './setup-dialog';
import { SwapSettings } from './swap-settings';
import type { BondSeries } from './types';
import { describeBlocker } from './validate';

import { Card, DarkBox } from '../../components/ui';
import { useBondRoute } from '../../hooks/use-bond-route';
import { useChainTime } from '../../hooks/use-chain-time';
import { usePaymentAssets } from '../../hooks/use-payment-assets';
import { useSwapSettings } from '../../hooks/use-swap-settings';
import { ADDRESSES } from '../../lib/addresses';
import { describeError } from '../../lib/errors';
import { BOND_PAYMENT_ASSETS, venueFor } from '../../lib/swap';
import { formatDuration, smartFormatter } from '../../lib/utils';

// Leaves room for a two-transaction route.
const CLOSING_SOON_SECONDS = 10 * 60;

const previewText = (
  hasAmount: boolean,
  isLoading: boolean,
  stratOut: number | null,
): string => {
  if (!hasAmount) return '—';
  if (isLoading || stratOut === null) return '…';
  return `${smartFormatter(stratOut, 6)} VVEST`;
};

const parseOrZero = (value: string, decimals: number): bigint => {
  try {
    return value && Number(value) > 0 ? parseUnits(value, decimals) : 0n;
  } catch {
    return 0n;
  }
};

export function BondPanel({
  series,
  onBonded,
}: {
  series: BondSeries;
  onBonded: () => void;
}) {
  const { assets } = usePaymentAssets();
  const { slippageBps, setSlippageBps, deadlineMinutes, setDeadlineMinutes } =
    useSwapSettings();
  const now = useChainTime();

  const [selectedAssetId, setSelectedAssetId] = useState(
    BOND_PAYMENT_ASSETS[0].id,
  );
  const [amount, setAmount] = useState('');
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupConfirmed, setSetupConfirmed] = useState(false);

  const payState =
    assets.find((state) => state.asset.id === selectedAssetId) ?? assets[0];
  // By address: the list order is configuration.
  const btcState = assets.find(
    (state) =>
      state.asset.address.toLowerCase() === ADDRESSES.BTC.toLowerCase(),
  );

  const btcDecimals = btcState?.decimals ?? series.decimals;
  const btcSymbol = btcState?.symbol ?? series.asset;
  const venue = payState ? venueFor(payState.asset) : undefined;
  const isSwapRoute = !!venue;

  const route = useBondRoute({
    seriesId: series.id,
    asset: payState?.asset ?? BOND_PAYMENT_ASSETS[0],
    assetDecimals: payState?.decimals ?? 8,
    assetSymbol: payState?.symbol ?? '',
    amount,
    btcDecimals,
    btcSymbol,
    btcBalance: btcState?.balance,
    slippageBps,
    deadlineMinutes,
    onBonded: () => {
      setAmount('');
      onBonded();
    },
  });

  const {
    quote,
    pending,
    bondAmountRaw,
    bondAmountIsSettled,
    isPreviewLoading,
  } = route;

  const amountRaw = parseOrZero(amount, payState?.decimals ?? 8);
  const stratOut = route.stratOut
    ? Number(formatUnits(route.stratOut, 18))
    : null;

  const validationError = pending
    ? ''
    : describeBlocker({
        amount,
        amountRaw,
        payState,
        isSwapRoute,
        quote,
        minPurchaseRaw: series.minPurchaseRaw,
        minPurchaseLabel: series.minPurchaseBtc,
        btcSymbol,
      });

  const overCapacity =
    route.stratOut !== undefined && route.stratOut > series.remainingStratRaw;

  const closingSoon =
    isSwapRoute &&
    !pending &&
    series.endsAt > 0 &&
    now > 0 &&
    series.endsAt - now < CLOSING_SOON_SECONDS;

  const blocked = !!validationError || overCapacity || !series.isOpen;

  const canSubmit = route.canExecute && !blocked;

  const needsSetupExplainer = isSwapRoute && route.oneTimeStepsRemaining > 0;

  const effectivePerStrat =
    isSwapRoute && stratOut && stratOut > 0 && amountRaw > 0n && payState
      ? Number(formatUnits(amountRaw, payState.decimals)) / stratOut
      : null;

  const swapOutput = quote
    ? smartFormatter(Number(formatUnits(quote.amountOut, btcDecimals)), 8)
    : '—';

  return (
    <Card className="sticky top-24 h-fit p-6">
      <div className="mb-6 flex items-start justify-between gap-2">
        <h3 className="text-xl font-bold text-white">Bond {series.name}</h3>
        {isSwapRoute && (
          <SwapSettings
            slippageBps={slippageBps}
            onSlippageChange={setSlippageBps}
            deadlineMinutes={deadlineMinutes}
            onDeadlineChange={setDeadlineMinutes}
          />
        )}
      </div>

      <div className="space-y-4">
        {pending && (
          <PendingSwapBanner
            pending={pending}
            amountRaw={bondAmountRaw}
            btcDecimals={btcDecimals}
            btcSymbol={btcSymbol}
            shortfall={route.pendingShortfall}
            onDiscard={route.discardPending}
          />
        )}

        {!pending && (
          <PayWith
            assets={assets}
            selectedId={selectedAssetId}
            onSelect={(id) => {
              // An amount typed in another asset is in the wrong unit.
              setSelectedAssetId(id);
              setAmount('');
            }}
            amount={amount}
            onAmountChange={setAmount}
            validationError={validationError}
            disabled={route.isProcessing}
          />
        )}

        {isSwapRoute && !pending && (
          <>
            <div className="flex justify-center">
              <div className="bg-border rounded-full p-1.5">
                <ArrowDown size={16} className="text-muted" />
              </div>
            </div>

            <div>
              <span className="text-muted mb-2 block text-sm">Swap gives</span>
              <div className="border-border bg-dark/50 flex w-full justify-between gap-3 rounded-lg border p-3">
                <span className="text-muted font-mono text-sm">
                  {btcSymbol}
                </span>
                <span className="font-mono font-bold text-white">
                  {!quote && route.isQuoting ? '…' : swapOutput}
                </span>
              </div>
            </div>

            {quote && venue && payState && (
              <RouteSummary
                quote={quote}
                venue={venue}
                symbolIn={payState.symbol}
                symbolOut={btcSymbol}
                decimalsIn={payState.decimals}
                decimalsOut={btcDecimals}
                slippageBps={slippageBps}
                isStale={route.isQuoting}
              />
            )}

            {route.quoteError && (
              <p className="text-red text-xs">
                The pool could not price this swap:{' '}
                {describeError(route.quoteError).detail}
              </p>
            )}
          </>
        )}

        <div>
          <span className="text-muted mb-2 block text-sm">
            {bondAmountIsSettled ? 'You receive' : 'You receive (estimated)'}
          </span>
          <div className="border-border bg-dark/50 flex w-full justify-between gap-3 rounded-lg border p-3">
            <span className="text-muted font-mono text-sm">VVEST</span>
            <span className="text-green font-mono font-bold">
              {previewText(
                bondAmountRaw !== undefined,
                isPreviewLoading,
                stratOut,
              )}
            </span>
          </div>
        </div>

        <DarkBox className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted">Bonding price</span>
            <span className="text-white">
              {smartFormatter(series.priceBtc)} {btcSymbol} per STRAT
            </span>
          </div>
          {effectivePerStrat !== null && payState && (
            <div className="flex justify-between gap-3">
              <span className="text-muted">Your cost per STRAT</span>
              <span className="text-white">
                {smartFormatter(effectivePerStrat, 4)} {payState.symbol}
              </span>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <span className="text-muted">Vesting term</span>
            <span className="text-white">
              {formatDuration(series.vestingTermSeconds)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted">Minimum bond</span>
            <span className="text-white">
              {smartFormatter(series.minPurchaseBtc)} {btcSymbol}
            </span>
          </div>
        </DarkBox>

        {route.steps.length > 1 && (
          <div className="border-border rounded-lg border p-3">
            <div className="text-muted mb-2 text-[11px] uppercase tracking-wide">
              {route.steps.length} transactions
            </div>
            <RouteSteps steps={route.steps} isProcessing={route.isProcessing} />
          </div>
        )}

        {!series.isOpen && (
          <p className="text-muted text-xs">This series is closed.</p>
        )}

        {overCapacity && (
          <p className="text-red text-xs">
            Over what the series has left (
            {smartFormatter(series.remainingStrat)} STRAT).
          </p>
        )}

        {closingSoon && (
          <p className="text-xs text-orange-300">
            Series closes in {formatDuration(Math.max(series.endsAt - now, 0))}.
            If the bond misses it, you keep the {btcSymbol}.
          </p>
        )}

        {needsSetupExplainer && (
          <p className="text-xs text-orange-300">
            First time with {payState?.symbol}: {route.steps.length}{' '}
            transactions, {route.oneTimeStepsRemaining} of them one-off.
          </p>
        )}

        <button
          onClick={() =>
            needsSetupExplainer && !setupConfirmed
              ? setSetupOpen(true)
              : route.execute()
          }
          disabled={!canSubmit}
          className="bg-orange hover:bg-orange/90 mt-2 w-full rounded-lg py-4 font-bold text-black transition-all disabled:cursor-not-allowed disabled:bg-gray-500 disabled:hover:bg-gray-500"
        >
          {route.buttonText}
        </button>

        {route.error && (
          <p className="text-red text-center text-xs">
            {describeError(route.error).detail}
          </p>
        )}

        <p className="text-muted flex items-center justify-center gap-1 text-center text-xs">
          <Info size={12} />
          VVEST is non-transferable until vested.
        </p>

        <SetupDialog
          open={setupOpen}
          onOpenChange={setSetupOpen}
          steps={route.steps}
          assetSymbol={payState?.symbol ?? ''}
          btcSymbol={btcSymbol}
          onConfirm={() => {
            setSetupConfirmed(true);
            setSetupOpen(false);
            route.execute();
          }}
        />
      </div>
    </Card>
  );
}
