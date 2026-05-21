import { useEffect, useRef } from 'react';
import { formatUnits } from 'viem';

import { usePreviewRedemption } from './use-preview-redemption';
import { useProtocolChain } from './use-protocol-chain';
import { useRedeem } from './use-redeem';

import { notifyTransaction } from '../lib/notifications';

type UseRedeemFlowParams = {
  amount: string;
  enabled?: boolean;
  onSuccess?: () => void;
};

export const useRedeemFlow = ({
  amount,
  enabled = true,
  onSuccess,
}: UseRedeemFlowParams) => {
  const { onProtocolChain: isCorrectNetwork } = useProtocolChain();

  const {
    grossBtc,
    effPenaltyBtc,
    thfBonusBtc,
    netBtc,
    remainingRcap,
    isLoading: isLoadingPreview,
  } = usePreviewRedemption({
    amount,
    decimals: 18,
    enabled,
  });

  // The Treasury pays whole satoshis and rounds down; an unrounded floor would always revert with `PayoutBelowMin`.
  const BTC_UNIT_IN_WAD = 10n ** 10n;
  const minNetBtc =
    netBtc === undefined
      ? undefined
      : (netBtc / BTC_UNIT_IN_WAD) * BTC_UNIT_IN_WAD;

  const {
    redeem,
    isPending: isRedeeming,
    isConfirming: isRedeemConfirming,
    isSuccess: isRedeemSuccess,
    error: redeemError,
    reset: resetRedeem,
  } = useRedeem({
    amount,
    decimals: 18,
    enabled,
    minNetBtc,
  });

  const redeemNotified = useRef(false);

  useEffect(() => {
    if (isRedeemSuccess && !redeemNotified.current) {
      notifyTransaction.success(
        'redeem',
        undefined,
        `Redeemed ${amount} staked STRAT`,
      );
      redeemNotified.current = true;
      onSuccess?.();
    }
  }, [isRedeemSuccess, amount, onSuccess]);

  useEffect(() => {
    if (redeemError) {
      notifyTransaction.error('redeem', redeemError);
    }
  }, [redeemError]);

  useEffect(() => {
    resetRedeem();
    redeemNotified.current = false;
  }, [amount, resetRedeem]);

  const execute = () => {
    void redeem();
  };

  const formatBtc = (value: bigint | undefined) => {
    if (!value) return '0.00';
    return Number(formatUnits(value, 18)).toFixed(8);
  };

  const isRcapExhausted = remainingRcap !== undefined && remainingRcap === 0n;
  const isProcessing = isRedeeming || isRedeemConfirming;

  const canExecute =
    !!amount &&
    parseFloat(amount) > 0 &&
    !isProcessing &&
    isCorrectNetwork &&
    !isRcapExhausted;

  const getButtonText = () => {
    if (isProcessing) {
      if (isRedeemConfirming) return 'Confirming Redemption...';
      return 'Redeeming...';
    }
    if (isRedeemSuccess) return 'Redeemed Successfully!';
    return 'Confirm Redemption';
  };

  return {
    execute,
    isProcessing,
    canExecute,
    buttonText: getButtonText(),
    error: redeemError,
    isSuccess: isRedeemSuccess,
    isCorrectNetwork,
    preview: {
      grossBtc: formatBtc(grossBtc),
      effPenaltyBtc: formatBtc(effPenaltyBtc),
      thfBonusBtc: formatBtc(thfBonusBtc),
      netBtc: formatBtc(netBtc),
      remainingRcap: remainingRcap ? formatUnits(remainingRcap, 18) : '0',
      isLoading: isLoadingPreview,
      isRcapExhausted,
    },
  };
};
