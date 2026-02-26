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
    oracleReady,
    backingSupply,
  } = useProtocolDashboard();
  const stratMarketPrice = oracleReady ? marketUsdPerStrat : null;

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
          title="NAV per $STRAT"
          value={navUsdPerStrat === null ? '—' : `${navUsdPerStrat.toFixed(6)}`}
          subValue={`${navBtcPerStrat.toFixed(16)} BTC`}
          icon={ShieldCheck}
        />
        <StatCard
          title="Market Price"
          value={`$${smartFormatter(stratMarketPrice)}`}
          subValue={`Premium: ${smartFormatter(premiumPct)}%`}
          icon={Activity}
        />
        <StatCard
          title="Backing per STRAT"
          value={`${navBtcPerStrat.toFixed(10)} BTC`}
          subValue={`${smartFormatter(treasuryBtc)} BTC over ${smartFormatter(backingSupply)} STRAT`}
          icon={ArrowUpRight}
          infoTooltip="The Treasury's bitcoin divided by the STRAT that has actually been sold, read straight from the contracts. Tokens the protocol still holds are not counted, because no bitcoin came in against them. It rises as bonds and premium sales add bitcoin, and it is the floor every bond series must price above. It is not a yield: nothing is distributed on it."
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
