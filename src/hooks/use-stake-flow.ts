import { useEffect, useRef } from 'react';
import { useReadContract } from 'wagmi';

import { useApproveToken } from './use-approve-token';
import { useProtocolChain } from './use-protocol-chain';
import { useStake } from './use-stake';

import { STAKING_ABI } from '../lib/abi/staking';
import { ADDRESSES } from '../lib/addresses';
import { notifyTransaction } from '../lib/notifications';

type UseStakeFlowParams = {
  amount: string;
  enabled?: boolean;
  onSuccess?: () => void;
};

export const useStakeFlow = ({
  amount,
  enabled = true,
  onSuccess,
}: UseStakeFlowParams) => {
  const { onProtocolChain: isCorrectNetwork } = useProtocolChain();

  const { data: stratTokenAddress } = useReadContract({
    address: ADDRESSES.STAKING,
    abi: STAKING_ABI,
    functionName: 'stratToken',
    query: {
      enabled: enabled && isCorrectNetwork,
    },
  });

  const isEnabled =
    enabled && !!stratTokenAddress && !!amount && parseFloat(amount) > 0;

  const {
    approve,
    needsApproval,
    isPending: isApproving,
    isConfirming: isApprovalConfirming,
    isSuccess: isApprovalSuccess,
    error: approvalError,
    allowance,
    refetchAllowance,
  } = useApproveToken({
    tokenAddress: stratTokenAddress as `0x${string}` | undefined,
    spenderAddress: ADDRESSES.STAKING,
    amount,
    decimals: 18,
    enabled: isEnabled,
  });

  const {
    stake,
    isPending: isStaking,
    isConfirming: isStakeConfirming,
    isSuccess: isStakeSuccess,
    error: stakeError,
    reset: resetStake,
  } = useStake({
    amount,
    tokenAddress: stratTokenAddress as `0x${string}` | undefined,
    decimals: 18,
    enabled: isEnabled && !needsApproval,
  });

  const approvalNotified = useRef(false);
  const stakeNotified = useRef(false);

  useEffect(() => {
    if (isApprovalSuccess) {
      refetchAllowance();
      if (!approvalNotified.current) {
        notifyTransaction.success(
          'approve',
          undefined,
          'Token approved for staking',
        );
        approvalNotified.current = true;
      }
    }
  }, [isApprovalSuccess, refetchAllowance]);

  useEffect(() => {
    if (isStakeSuccess && !stakeNotified.current) {
      notifyTransaction.success('stake', undefined, `Staked ${amount} STRAT`);
      stakeNotified.current = true;
      onSuccess?.();
    }
  }, [isStakeSuccess, amount, onSuccess]);

  useEffect(() => {
    if (approvalError) {
      notifyTransaction.error('approve', approvalError);
    }
  }, [approvalError]);

  useEffect(() => {
    if (stakeError) {
      notifyTransaction.error('stake', stakeError);
    }
  }, [stakeError]);

  useEffect(() => {
    resetStake();
    approvalNotified.current = false;
    stakeNotified.current = false;
  }, [amount, resetStake]);

  // Until the allowance is read the next step is unknown, and a mined approval counts only once the
  // refetched allowance covers the amount; either gap would otherwise send an unapproved stake.
  const allowanceKnown = allowance !== undefined;
  const isSyncingAllowance = isApprovalSuccess && needsApproval;

  const execute = () => {
    if (!allowanceKnown || isSyncingAllowance) return;
    if (needsApproval) {
      void approve();
    } else {
      void stake();
    }
  };

  const isProcessing =
    isApproving ||
    isApprovalConfirming ||
    isSyncingAllowance ||
    isStaking ||
    isStakeConfirming;

  const canExecute =
    !!amount &&
    parseFloat(amount) > 0 &&
    !isProcessing &&
    isCorrectNetwork &&
    !!stratTokenAddress &&
    allowanceKnown;

  const getButtonText = () => {
    if (isProcessing) {
      if (isApprovalConfirming || isSyncingAllowance)
        return 'Confirming Approval...';
      if (isApproving) return 'Approving...';
      if (isStakeConfirming) return 'Confirming Stake...';
      if (isStaking) return 'Staking...';
      return 'Processing...';
    }
    if (isStakeSuccess) return 'Staked Successfully!';
    if (isEnabled && !allowanceKnown) return 'Checking allowance...';
    if (needsApproval) return 'Approve & Stake';
    return 'Stake';
  };

  return {
    execute,
    isProcessing,
    canExecute,
    buttonText: getButtonText(),
    needsApproval,
    error: approvalError || stakeError,
    isSuccess: isStakeSuccess,
    isCorrectNetwork,
  };
};
