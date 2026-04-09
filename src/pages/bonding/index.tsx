import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { BondCard } from './bond-card';
import { BondPanel } from './bond-panel';

import { Card } from '../../components/ui';
import { useGetBondingSeries } from '../../hooks/use-get-bonding-series';
import { getSeriesLetter } from '../../hooks/use-get-bonding-series';
import { useReportedError } from '../../hooks/use-reported-error';
import { useVestingOverview } from '../../hooks/use-vesting-overview';
import { refreshAfterWrite } from '../../lib/invalidate';
import { VestingScheduleCard } from '../vesting/vesting-schedule-card';

export function Bonding() {
  const queryClient = useQueryClient();
  const { series, isLoading, error } = useGetBondingSeries();
  const seriesError = useReportedError('bonding series', error);
  const [selectedSeries, setSelectedSeries] = useState<string>('');

  const seriesData = series;

  const defaultSelectedSeries =
    seriesData.length > 0 && !selectedSeries
      ? seriesData[0].id
      : selectedSeries;
  const activeSeries =
    seriesData.find((s) => s.id === defaultSelectedSeries) || seriesData[0];

  const { schedules, isLoading: isLoadingVesting } = useVestingOverview();

  // Called after the receipt confirms, so one refresh is enough.
  const handleBondSuccess = useCallback(() => {
    void refreshAfterWrite(queryClient);
  }, [queryClient]);

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

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
          Bonding & Vesting
        </h1>
        <p className="text-muted max-w-2xl">
          Buy $STRAT from the protocol at a fixed price in bitcoin. What you
          receive vests linearly over the series term, and the bitcoin you paid
          stays in the Treasury as backing. Arriving with dollars is fine — they
          are swapped to bitcoin in your own wallet first, at a cost this screen
          shows you before you sign.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-white">Select Bond Series</h2>
          {isLoading && (
            <div className="text-muted flex h-32 items-center justify-center">
              Loading series...
            </div>
          )}
          {error && (
            <div className="text-red flex h-32 items-center justify-center">
              Could not load the series: {seriesError?.detail}
            </div>
          )}
          {!isLoading && !error && seriesData.length === 0 && (
            <div className="text-muted flex h-32 items-center justify-center">
              No active series available
            </div>
          )}
          {!isLoading && !error && seriesData.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {seriesData.map((item) => (
                <BondCard
                  key={item.id}
                  series={item}
                  isSelected={(selectedSeries || seriesData[0]?.id) === item.id}
                  onClick={() => setSelectedSeries(item.id)}
                />
              ))}
            </div>
          )}

          <Card className="mt-8 p-6">
            <h3 className="mb-4 text-lg font-bold text-white">
              Your Vesting Overview
            </h3>
            {(() => {
              if (isLoadingVesting) {
                return (
                  <div className="border-border bg-dark/30 text-muted flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
                    Loading vesting data...
                  </div>
                );
              }
              if (activeVests.length === 0) {
                return (
                  <div className="border-border bg-dark/30 text-muted flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
                    No active vesting schedules. Bond to start vesting!
                  </div>
                );
              }
              return (
                <div className="space-y-4">
                  {activeVests.map((vest) => (
                    <VestingScheduleCard key={vest.id} vest={vest} />
                  ))}
                </div>
              );
            })()}
          </Card>
        </div>

        {activeSeries ? (
          <BondPanel
            key={activeSeries.id}
            series={activeSeries}
            onBonded={handleBondSuccess}
          />
        ) : (
          <Card className="sticky top-24 h-fit p-6">
            <h3 className="mb-6 text-xl font-bold text-white">
              Select a Series
            </h3>
            <div className="text-muted flex h-32 items-center justify-center text-sm">
              Please select a series to continue
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
