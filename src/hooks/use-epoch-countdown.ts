import { useReadContracts } from 'wagmi';

import { useChainTime } from './use-chain-time';

import { REDEMPTION_ABI } from '../lib/abi/redemption';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';

type EpochCountdown = {
  epoch?: bigint;
  nextEpochAtMs?: number;
  secondsRemaining?: number;
  epochDurationSec?: number;
  isLoading: boolean;
  error?: Error | null;
};

/** Epochs are not aligned to unix time: changing the duration re-anchors the current one. */
export const useEpochCountdown = (): EpochCountdown => {
  const now = useChainTime();

  const base = {
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.REDEMPTION,
    abi: REDEMPTION_ABI,
  } as const;

  const { data, isLoading, error } = useReadContracts({
    contracts: [
      { ...base, functionName: 'epochDuration' },
      { ...base, functionName: 'epochAnchorTime' },
      { ...base, functionName: 'epochAnchorIndex' },
      { ...base, functionName: 'currentEpoch' },
    ],
  });

  const duration = data?.[0]?.result as bigint | undefined;
  const anchorTime = data?.[1]?.result as bigint | undefined;
  const anchorIndex = data?.[2]?.result as bigint | undefined;
  const epoch = data?.[3]?.result as bigint | undefined;

  if (!duration || duration === 0n || epoch === undefined) {
    return { isLoading, error: (error as Error) ?? null };
  }

  const elapsedEpochs = epoch - (anchorIndex ?? 0n);
  const nextBoundary = (anchorTime ?? 0n) + (elapsedEpochs + 1n) * duration;

  const secondsRemaining = Math.max(0, Number(nextBoundary) - now);

  return {
    epoch,
    nextEpochAtMs: Number(nextBoundary) * 1000,
    secondsRemaining,
    epochDurationSec: Number(duration),
    isLoading,
    error: (error as Error) ?? null,
  };
};
