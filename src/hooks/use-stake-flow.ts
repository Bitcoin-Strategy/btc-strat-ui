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
    enabled: isEnabled && (!needsApproval || isApprovalSuccess),
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

  const execute = () => {
    if (needsApproval && !isApprovalSuccess) {
      void approve();
    } else {
      void stake();
    }
  };

  const isProcessing =
    isApproving || isApprovalConfirming || isStaking || isStakeConfirming;

  const canExecute =
    !!amount &&
    parseFloat(amount) > 0 &&
    !isProcessing &&
    isCorrectNetwork &&
    !!stratTokenAddress;

  const getButtonText = () => {
    if (isProcessing) {
      if (isApprovalConfirming) return 'Confirming Approval...';
      if (isApproving) return 'Approving...';
      if (isStakeConfirming) return 'Confirming Stake...';
      if (isStaking) return 'Staking...';
      return 'Processing...';
    }
    if (isStakeSuccess) return 'Staked Successfully!';
    if (needsApproval && !isApprovalSuccess) return 'Approve & Stake';
    return 'Stake';
  };

  return {
    execute,
    isProcessing,
    canExecute,
    buttonText: getButtonText(),
    needsApproval: needsApproval && !isApprovalSuccess,
    error: approvalError || stakeError,
    isSuccess: isStakeSuccess,
    isCorrectNetwork,
  };
};
