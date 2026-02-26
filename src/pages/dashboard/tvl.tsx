import { Coins, Lock, TrendingUp } from 'lucide-react';

import { Card, DarkBox } from '../../components/ui';
import { useTvl } from '../../hooks/use-tvl';
import { smartFormatter } from '../../lib';

/** Staked STRAT is not priced: it is a claim on the same Treasury BTC. */
export function Tvl() {
  const {
    treasuryBtc,
    treasuryUsd,
    stakedStrat,
    stakedShareOfSupply,
    stratTotalSupply,
    backingSupply,
    isLoading,
  } = useTvl();

  return (
    <Card className="p-6">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
        <TrendingUp size={20} className="text-green" />
        Backing and Locked Supply
      </h3>

      <DarkBox className="mb-6 p-4">
        <div className="text-muted mb-1 text-xs font-bold uppercase">
          Treasury backing
        </div>
        <div className="font-mono text-2xl font-bold text-white sm:text-3xl">
          {isLoading ? '—' : `${smartFormatter(treasuryBtc)} BTC`}
        </div>
        <div className="text-muted mt-2 text-xs">
          ${smartFormatter(treasuryUsd)} · the one asset behind every STRAT
        </div>
      </DarkBox>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            <Lock size={16} className="text-orange" /> Staked STRAT
          </span>
          <div className="text-right">
            <div className="font-mono text-white">
              {isLoading ? '—' : smartFormatter(stakedStrat)}
            </div>
            <div className="text-muted text-xs">
              {(stakedShareOfSupply * 100).toFixed(2)}% of sold supply
            </div>
          </div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            <Coins size={16} className="text-orange" /> Sold supply
          </span>
          <div className="text-right">
            <div className="font-mono text-white">
              {isLoading ? '—' : smartFormatter(backingSupply)}
            </div>
            <div className="text-muted text-xs">what NAV divides by</div>
          </div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            <Coins size={16} className="text-muted" /> Total supply
          </span>
          <div className="font-mono text-white">
            {isLoading ? '—' : smartFormatter(stratTotalSupply)}
          </div>
        </div>

        <DarkBox className="text-muted text-xs">
          Staked STRAT is not added to the backing. It is a claim on the same
          bitcoin, so counting both would report that bitcoin twice. The
          difference between the two supplies is STRAT the protocol still holds:
          nobody has paid for it, so no bitcoin stands behind it and NAV leaves
          it out.
        </DarkBox>
      </div>
    </Card>
  );
}
