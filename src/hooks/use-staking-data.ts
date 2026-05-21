import { formatUnits } from 'viem';
import { useBlock, useConnection, useReadContract } from 'wagmi';

import { PROTOCOL_READER_ABI } from '../lib/abi/protocol-reader';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';

const STRAT_DECIMALS = 18;

type StakingDataRaw = {
  stakedAmount: bigint;
  stakeTimestamp: bigint;
  currentThf: bigint;
  thfMin: bigint;
  thfMax: bigint;
  thfMaxTime: bigint;
};

export type FormattedStakingData = {
  stakedAmount: number;
  stakedAmountFormatted: string;
  stakeTimestamp: number;
  currentThf: number;
  thfMin: number;
  thfMax: number;
  thfMaxTime: number;
};

export const useStakingData = () => {
  const { address } = useConnection();

  // Chain time: a lagging local clock would give negative ages.
  const { data: block } = useBlock({
    chainId: PROTOCOL_CHAIN.id,
  });
  const currentTime = block ? Number(block.timestamp) : 0;

  const { data, isLoading, error, refetch } = useReadContract({
    address: ADDRESSES.PROTOCOL_READER,
    abi: PROTOCOL_READER_ABI,
    functionName: 'getStakingData',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const stakingData = data as StakingDataRaw | undefined;

  const stakedAmountFormatted = stakingData?.stakedAmount
    ? formatUnits(stakingData.stakedAmount, STRAT_DECIMALS)
    : '0';

  const stakedAmount = Number(stakedAmountFormatted);

  const stakeTimestamp = stakingData?.stakeTimestamp
    ? Number(stakingData.stakeTimestamp)
    : 0;

  const currentThf = stakingData?.currentThf
    ? Number(formatUnits(stakingData.currentThf, 18))
    : 0;

  const thfMin = stakingData?.thfMin
    ? Number(formatUnits(stakingData.thfMin, 18))
    : 0;

  const thfMax = stakingData?.thfMax
    ? Number(formatUnits(stakingData.thfMax, 18))
    : 0.95;

  const thfMaxTime = stakingData?.thfMaxTime
    ? Number(stakingData.thfMaxTime)
    : 0;

  // Seconds, so short durations do not all read as "0 days".
  const timeStakedSeconds =
    stakeTimestamp > 0 && currentTime > 0
      ? Math.max(0, currentTime - stakeTimestamp)
      : 0;

  // `thfMaxTime` is a duration, not a timestamp.
  const timeToMaxSeconds =
    thfMaxTime > 0 && stakeTimestamp > 0 && currentTime > 0
      ? Math.max(0, stakeTimestamp + thfMaxTime - currentTime)
      : 0;

  const hasActiveStake = stakedAmount > 0;

  return {
    stakedAmount,
    stakedAmountFormatted,
    stakeTimestamp,
    currentThf,
    thfMin,
    thfMax,
    thfMaxTime,
    timeStakedSeconds,
    timeToMaxSeconds,
    hasActiveStake,
    isLoading,
    error,
    refetch,
  };
};
