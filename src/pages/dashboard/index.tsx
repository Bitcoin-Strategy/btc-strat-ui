/* eslint-disable react-hooks/purity */
import {
  Activity,
  ArrowUpRight,
  Bitcoin,
  Check,
  ShieldCheck,
} from 'lucide-react';
import Countdown from 'react-countdown';

import { Bands } from './bands';
import { Chart } from './chart';
import { PremiumSale } from './premium-sale';
import { StatCard } from './stat-card';
import { Tvl } from './tvl';

import { useEpochCountdown } from '../../hooks/use-epoch-countdown';
import { useProtocolDashboard } from '../../hooks/use-protocol-dashboard';
import { smartFormatter } from '../../lib';

export function Dashboard() {
  const {
    treasuryBtc,
    treasuryUsd,
    navBtcPerStrat,
    navUsdPerStrat,
    marketUsdPerStrat,
    premiumPct,
    mnav,
    oracleReady,
    backingSupply,
  } = useProtocolDashboard();
  const stratMarketPrice = oracleReady ? marketUsdPerStrat : null;
  const mnavShown = oracleReady ? mnav : null;

  const { nextEpochAtMs } = useEpochCountdown();

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
            Protocol Dashboard
          </h1>
          <p className="text-muted">
            Real-time overview of the Bitcoin Strategy Treasury.
          </p>
        </div>
        <div className="sm:text-right">
          <div className="text-muted mb-1 text-sm">Next Epoch</div>
          <div className="font-mono text-xl text-white">
            <Countdown
              date={nextEpochAtMs ?? Date.now() + 10_000}
              renderer={({ hours, minutes, seconds, completed }) => {
                if (completed) {
                  return <Check />;
                } else {
                  return (
                    <span>
                      {hours.toLocaleString('en-US', {
                        minimumIntegerDigits: 2,
                      })}
                      :
                      {minutes.toLocaleString('en-US', {
                        minimumIntegerDigits: 2,
                      })}
                      :
                      {seconds.toLocaleString('en-US', {
                        minimumIntegerDigits: 2,
                      })}
                    </span>
                  );
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Treasury Balance"
          value={`${smartFormatter(treasuryBtc as number)} BTC`}
          subValue={`≈ $${smartFormatter(treasuryUsd as number)}`}
          icon={Bitcoin}
        />
        <StatCard
          title="NAV (BTC)"
          value={`${(navBtcPerStrat * 1e8).toFixed(2)} sats / STRAT`}
          subValue={`${navBtcPerStrat.toFixed(10)} BTC`}
          icon={ShieldCheck}
          infoTooltip={`How much bitcoin backs each Activated STRAT: the Treasury's ${smartFormatter(treasuryBtc)} BTC over ${smartFormatter(backingSupply)} STRAT actually sold, read straight from the contracts. Tokens the protocol still holds are not counted, because no bitcoin came in against them. It rises as bonds and premium sales add bitcoin, and it is the floor every bond series must price above. It is not a yield: nothing is distributed on it.`}
        />
        <StatCard
          title="NAV (USD)"
          value={
            navUsdPerStrat === null
              ? '—'
              : `$${navUsdPerStrat.toFixed(6)} / STRAT`
          }
          icon={ArrowUpRight}
          infoTooltip="The current dollar value of that exact same bitcoin backing. It moves with the price of bitcoin; the backing itself does not."
        />
        <StatCard
          title="Market Price"
          value={
            stratMarketPrice === null
              ? '—'
              : `$${smartFormatter(stratMarketPrice)} / STRAT`
          }
          subValue={
            mnavShown === null || premiumPct === null
              ? undefined
              : [
                  `${mnavShown.toFixed(2)}× NAV`,
                  `${premiumPct >= 0 ? '+' : ''}${premiumPct.toFixed(2)}% ${premiumPct >= 0 ? 'premium' : 'discount'}`,
                ]
          }
          icon={Activity}
        />
      </div>

      <Chart />

      <div className="mt-6">
        <Tvl />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PremiumSale />

        <Bands />
      </div>
    </div>
  );
}
