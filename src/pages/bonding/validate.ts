import type { PaymentAssetState } from '../../hooks/use-payment-assets';
import type { SwapQuote } from '../../lib/swap';
import { smartFormatter } from '../../lib/utils';

/** Pre-flight checks. A stablecoin bond is checked against the worst swap output. */
export const describeBlocker = ({
  amount,
  amountRaw,
  payState,
  isSwapRoute,
  quote,
  minPurchaseRaw,
  minPurchaseLabel,
  btcSymbol,
}: {
  amount: string;
  amountRaw: bigint;
  payState: PaymentAssetState | undefined;
  isSwapRoute: boolean;
  quote: SwapQuote | undefined;
  minPurchaseRaw: bigint;
  minPurchaseLabel: number;
  btcSymbol: string;
}): string => {
  if (!amount || Number(amount) <= 0) return '';

  if (payState && amountRaw > payState.balance) {
    return `Not enough ${payState.symbol}. You hold ${smartFormatter(
      Number(payState.balanceInput),
      8,
    )}.`;
  }

  if (!isSwapRoute) {
    return amountRaw < minPurchaseRaw
      ? `Minimum bond is ${smartFormatter(minPurchaseLabel)} ${btcSymbol}.`
      : '';
  }

  if (quote && quote.minAmountOut < minPurchaseRaw) {
    return `After slippage this can land under the ${smartFormatter(
      minPurchaseLabel,
    )} ${btcSymbol} minimum. Raise the amount.`;
  }

  return '';
};
