import { parseUnits } from 'viem';
import { useAccount, useReadContract } from 'wagmi';

import type { RedemptionPreview } from '../lib';
import { REDEMPTION_ABI } from '../lib/abi/redemption';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';

type UsePreviewRedemptionParams = {
  amount: string;
  user?: `0x${string}`;
  decimals?: number;
  enabled?: boolean;
};

/** A quote from the contract; earlier redemptions in the epoch lower it, which `minNetBtc` guards. */
export const usePreviewRedemption = ({
  amount,
  user,
  decimals = 18,
  enabled = true,
}: UsePreviewRedemptionParams) => {
  const { address: connectedAddress } = useAccount();
  const userAddress = user || connectedAddress;

  const amountBigInt =
    amount && parseFloat(amount) > 0 ? parseUnits(amount, decimals) : undefined;

  const { data, isLoading, error, refetch } = useReadContract({
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.REDEMPTION,
    abi: REDEMPTION_ABI,
    functionName: 'previewRedemption',
    args: userAddress && amountBigInt ? [userAddress, amountBigInt] : undefined,
    query: {
      enabled: enabled && !!userAddress && !!amountBigInt,
    },
  });

  const preview = data as RedemptionPreview | undefined;

  return {
    preview,
    isLoading,
    error,
    refetch,

    grossBtc: preview?.grossBtc,
    // Stays in the Treasury and lifts NAV.
    basePenaltyBtc: preview?.basePenaltyBtc,
    effPenaltyBtc: preview?.effPenaltyBtc,
    thfBonusBtc: preview?.thfBonusBtc,
    netBtc: preview?.netBtc,

    timeHeldFactor: preview?.timeHeldFactor,
    epoch: preview?.epoch,
    remainingRcap: preview?.remainingRcap,
  };
};
