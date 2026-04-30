import { formatUnits } from 'viem';
import { useConnection, useReadContract } from 'wagmi';

import { useChainTime } from './use-chain-time';

import { PROTOCOL_READER_ABI } from '../lib/abi/protocol-reader';
import { ADDRESSES } from '../lib/addresses';

const STRAT_DECIMALS = 18;

type VestSchedule = {
  amountStrat: bigint;
  claimedStrat: bigint;
  claimable: bigint;
  start: bigint;
  end: bigint;
  seriesId: number;
};

/** The reader returns three fields; the totals are summed from the schedules. */
type VestingOverviewData = {
  totalVvest: bigint;
  vestCount: bigint;
  schedules: VestSchedule[];
};

export type FormattedVestSchedule = {
  amountStrat: number;
  claimedStrat: number;
  claimable: number;
  start: number;
  end: number;
  seriesId: number;
};

export const useVestingOverview = () => {
  const { address } = useConnection();
  const currentTime = useChainTime(60_000);

  const { data, isLoading, error, refetch } = useReadContract({
    address: ADDRESSES.PROTOCOL_READER,
    abi: PROTOCOL_READER_ABI,
    functionName: 'getVestingOverview',
    args: address ? [address, 0n, 50n] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const overviewData = data as VestingOverviewData | undefined;

  const totalVvest = overviewData?.totalVvest
    ? Number(formatUnits(overviewData.totalVvest, STRAT_DECIMALS))
    : 0;

  const vestCount = overviewData?.vestCount
    ? Number(overviewData.vestCount)
    : 0;

  const raw = overviewData?.schedules ?? [];
  const sum = (pick: (s: VestSchedule) => bigint) =>
    Number(
      formatUnits(
        raw.reduce((t, s) => t + pick(s), 0n),
        STRAT_DECIMALS,
      ),
    );

  const totalVested = sum((s) => s.amountStrat);
  const totalClaimed = sum((s) => s.claimedStrat);
  const totalClaimable = sum((s) => s.claimable);

  // Linear release; finished vests release nothing.
  const vestingRatePerSec = raw.reduce((rate, s) => {
    const span = Number(s.end - s.start);
    if (span <= 0 || s.claimedStrat >= s.amountStrat) return rate;
    return rate + Number(formatUnits(s.amountStrat, STRAT_DECIMALS)) / span;
  }, 0);

  const pendingEnds = raw
    .filter((s) => s.claimedStrat < s.amountStrat)
    .map((s) => Number(s.end));
  const nextUnlockTime =
    pendingEnds.length > 0 ? Math.min(...pendingEnds) : null;

  const schedules: FormattedVestSchedule[] =
    overviewData?.schedules?.map((schedule) => ({
      amountStrat: Number(formatUnits(schedule.amountStrat, STRAT_DECIMALS)),
      claimedStrat: Number(formatUnits(schedule.claimedStrat, STRAT_DECIMALS)),
      claimable: Number(formatUnits(schedule.claimable, STRAT_DECIMALS)),
      start: Number(schedule.start),
      end: Number(schedule.end),
      seriesId: schedule.seriesId,
    })) || [];

  const lockedAmount = Math.max(totalVvest - totalClaimable, 0);
  const claimedAmount = totalClaimed;

  const SECONDS_PER_DAY = 86400;
  const rate = vestingRatePerSec * SECONDS_PER_DAY;

  const generateVestingProjection = (): Array<{
    month: string;
    claimed: number;
    locked: number;
  }> => {
    if (schedules.length === 0 || totalVvest === 0) {
      return [];
    }

    const now = currentTime;
    const projection: Array<{
      month: string;
      claimed: number;
      locked: number;
    }> = [];

    const latestEnd = Math.max(...schedules.map((s) => s.end));
    const monthsUntilEnd = Math.ceil((latestEnd - now) / (30 * 24 * 60 * 60));

    for (let i = 0; i <= Math.min(monthsUntilEnd, 12); i++) {
      const monthDate = now + i * 30 * 24 * 60 * 60;
      let unlockedByMonth = claimedAmount;
      let remainingLocked = lockedAmount;

      schedules.forEach((schedule) => {
        if (monthDate >= schedule.start) {
          const scheduleStart = schedule.start;
          const scheduleEnd = schedule.end;
          const scheduleTotal = schedule.amountStrat;
          const scheduleClaimed = schedule.claimedStrat;
          const scheduleRemaining = scheduleTotal - scheduleClaimed;

          if (monthDate >= scheduleEnd) {
            unlockedByMonth += scheduleRemaining;
            remainingLocked -= scheduleRemaining;
          } else if (monthDate > scheduleStart) {
            const scheduleProgress =
              (monthDate - scheduleStart) / (scheduleEnd - scheduleStart);
            const unlockedFromSchedule = scheduleRemaining * scheduleProgress;
            unlockedByMonth += unlockedFromSchedule;
            remainingLocked -= unlockedFromSchedule;
          }
        }
      });

      unlockedByMonth = Math.min(unlockedByMonth, totalVvest);
      remainingLocked = Math.max(0, totalVvest - unlockedByMonth);

      projection.push({
        month: `Month ${i + 1}`,
        claimed: Math.round(unlockedByMonth * 100) / 100,
        locked: Math.round(remainingLocked * 100) / 100,
      });
    }

    return projection.length > 0
      ? projection
      : [
          {
            month: 'Now',
            claimed: claimedAmount,
            locked: lockedAmount,
          },
        ];
  };

  const vestingProjection = generateVestingProjection();

  return {
    totalVvest,
    totalVested,
    totalClaimable,
    totalClaimed,
    vestingRatePerSec,
    nextUnlockTime,
    vestCount,
    schedules,
    lockedAmount,
    claimedAmount,
    rate,
    vestingProjection,
    isLoading,
    error,
    refetch,
  };
};
