import { ArrowRight, CheckCircle2, Timer, Unlock } from 'lucide-react';
import { useEffect, useState } from 'react';
import Countdown from 'react-countdown';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { VestingScheduleCard } from './vesting-schedule-card';
import { VestingStatCard } from './vesting-stat-card';

import { Switch } from '../../components/ui/switch';
import { useChainTime } from '../../hooks/use-chain-time';
import { useClaim } from '../../hooks/use-claim';
import { getSeriesLetter } from '../../hooks/use-get-bonding-series';
import { useVestingOverview } from '../../hooks/use-vesting-overview';
import { formatter } from '../../lib';
import { describeError } from '../../lib/errors';

export function Vesting() {
  const chainNow = useChainTime();
  const [isAutoStake, setIsAutoStake] = useState(false);

  const {
    totalVvest,
    totalClaimable,
    nextUnlockTime,
    schedules,
    vestCount,
    rate,
    vestingProjection,
    isLoading,
    refetch: refetchVesting,
  } = useVestingOverview();

  const {
    claim,
    isPending: isClaiming,
    isConfirming: isClaimConfirming,
    isSuccess: isClaimSuccess,
    error: claimError,
  } = useClaim({
    vestCount,
    enabled: !!vestCount && vestCount > 0 && totalClaimable > 0,
  });

  useEffect(() => {
    if (isClaimSuccess) {
      refetchVesting();
    }
  }, [isClaimSuccess, refetchVesting]);

  const activeVests = schedules.map((schedule, index) => {
    const startDate = new Date(schedule.start * 1000);
    const endDate = new Date(schedule.end * 1000);
    const total = schedule.amountStrat;
    const claimed = schedule.claimedStrat;
    const progress =
      total > 0 ? Math.min(100, Math.max(0, (claimed / total) * 100)) : 0;

    return {
      id: `vest-${schedule.seriesId}-${index}`,
      series: `Series ${getSeriesLetter(schedule.seriesId)}`,
      total,
      claimed,
      start: startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      end: endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      progress: Math.round(progress * 100) / 100,
    };
  });

  const networkFee = 4.5;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
            Vesting Dashboard
          </h1>
          <p className="text-muted max-w-2xl">
            Track your VVEST unlocks. VVEST converts 1:1 to $STRAT linearly over
            your chosen duration.
          </p>
        </div>
        <div className="border-border bg-card flex items-center gap-3 rounded-lg border px-4 py-2">
          <div className="text-right">
            <div className="text-muted text-xs">Next Unlock</div>
            <p className="font-mono font-bold text-white">
              {(() => {
                if (isLoading) {
                  return 'Loading...';
                }
                if (nextUnlockTime && nextUnlockTime > chainNow) {
                  return (
                    <Countdown
                      date={nextUnlockTime * 1000}
                      renderer={({ hours, minutes, seconds, completed }) => {
                        if (completed) {
                          return 'Completed';
                        } else {
                          return (
                            <>
                              <span>
                                {hours.toLocaleString('en-US', {
                                  minimumIntegerDigits: 2,
                                })}
                                h{' '}
                              </span>
                              <span>
                                {minutes.toLocaleString('en-US', {
                                  minimumIntegerDigits: 2,
                                })}
                                m{' '}
                              </span>
                              <span>
                                {seconds.toLocaleString('en-US', {
                                  minimumIntegerDigits: 2,
                                })}
                                s
                              </span>
                            </>
                          );
                        }
                      }}
                    />
                  );
                }
                return 'No upcoming unlock';
              })()}
            </p>
          </div>
          <div className="bg-dark rounded-md p-2">
            <Timer className="text-orange" size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <VestingStatCard
              label="Total VVEST"
              value={isLoading ? '...' : formatter.format(totalVvest)}
              subValue="Locked + Claimable"
            />
            <VestingStatCard
              label="Claimable $STRAT"
              value={isLoading ? '...' : formatter.format(totalClaimable)}
              subValue={
                isLoading ? '...' : `≈ ${formatter.format(totalClaimable)}`
              }
              variant="highlight"
            />
            <VestingStatCard
              label="Vesting Rate"
              value={isLoading ? '...' : formatter.format(rate)}
              subValue="$STRAT / Day"
            />
          </div>

          <div className="border-border bg-card rounded-xl border p-6">
            <h3 className="mb-6 text-lg font-bold text-white">
              Unlock Projection
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vestingProjection}>
                  <defs>
                    <linearGradient
                      id="colorClaimed"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorLocked"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#2A3441" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2A3441" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2A3441"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#94A3B8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151A21',
                      borderColor: '#2A3441',
                      color: '#fff',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    stackId="1"
                    dataKey="claimed"
                    stroke="#10B981"
                    fill="url(#colorClaimed)"
                    name="Unlocked"
                  />
                  <Area
                    type="monotone"
                    stackId="1"
                    dataKey="locked"
                    stroke="#94A3B8"
                    fill="url(#colorLocked)"
                    name="Locked"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {activeVests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">
                Active Vesting Schedules
              </h3>
              {activeVests.map((vest) => (
                <VestingScheduleCard key={vest.id} vest={vest} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="border-border bg-card sticky top-24 rounded-xl border p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold text-white">Claim $STRAT</h3>
              <Unlock size={20} className="text-green" />
            </div>

            <div className="border-border bg-dark mb-6 rounded-lg border p-4 text-center">
              <div className="text-muted mb-1 text-sm">Available to Claim</div>
              <div className="mb-2 font-mono text-2xl font-bold text-white sm:text-3xl">
                {isLoading ? '...' : formatter.format(totalClaimable)}
              </div>
              <div className="text-green flex items-center justify-center gap-1 text-xs">
                <CheckCircle2 size={12} /> Verified on-chain
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted">Network Fee</span>
                <span className="text-white">
                  ~${formatter.format(networkFee)}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted">Auto-Stake?</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted text-xs">(Coming Soon)</span>
                  <Switch
                    checked={isAutoStake}
                    onCheckedChange={(val) => setIsAutoStake(val)}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => void claim()}
              disabled={
                isClaiming ||
                isClaimConfirming ||
                totalClaimable === 0 ||
                isLoading
              }
              className="bg-green hover:bg-green/90 flex w-full items-center justify-center gap-2 rounded-lg py-4 font-bold text-black transition-all disabled:cursor-not-allowed disabled:bg-gray-500 disabled:hover:bg-gray-500"
            >
              {(() => {
                if (isClaiming || isClaimConfirming) return 'Claiming...';
                if (isClaimSuccess) return 'Claimed Successfully!';
                return 'Claim Tokens';
              })()}{' '}
              <ArrowRight size={18} />
            </button>
            {claimError && (
              <p className="text-red mt-2 text-center text-xs">
                {describeError(claimError).detail}
              </p>
            )}

            <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-200">
              <p>
                Claiming transfers $STRAT to your wallet. Consider staking
                immediately to start building your{' '}
                <span className="font-mono">TimeHeldFactor</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
