import { Gavel, Loader2 } from 'lucide-react';

import { Button, Card } from '../../components/ui';
import { usePremiumSale } from '../../hooks/use-premium-sale';
import { smartFormatter } from '../../lib';
import { describeError } from '../../lib/errors';
import { timeUntil } from '../../lib/governance';

function Row({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right">
        <span
          className={accent ? 'text-orange font-mono' : 'font-mono text-white'}
        >
          {value}
        </span>
        {sub && <span className="text-muted ml-2 text-xs">{sub}</span>}
      </span>
    </div>
  );
}

/** Permissionless premium sale; the caller earns a share of the surplus over NAV. */
export function PremiumSale() {
  const {
    eligible,
    reason,
    premiumPct,
    bandIndex,
    sellsStrat,
    treasuryGetsBtc,
    treasuryGetsUsd,
    rewardBtc,
    rewardUsd,
    limitedByLiquidity,
    allowedThisWindowStrat,
    windowCapStrat,
    soldThisWindowStrat,
    windowEndsAt,
    execute,
    isConnected,
    isSizing,
    isProcessing,
    canExecute,
    error,
  } = usePremiumSale();

  const soldPct =
    windowCapStrat > 0
      ? Math.min((soldThisWindowStrat / windowCapStrat) * 100, 100)
      : 0;

  const label = (() => {
    if (isProcessing) return 'Executing…';
    if (!isConnected) return 'Connect a wallet';
    if (isSizing) return 'Sizing the sale…';
    if (!canExecute) return 'No sale available';
    return 'Execute premium sale';
  })();

  return (
    <Card className="flex flex-col p-6">
      <div className="mb-2 flex items-center gap-2">
        <Gavel size={20} className="text-orange" />
        <h3 className="text-lg font-bold text-white">Premium Sale</h3>
        {eligible && (
          <span className="border-green/20 bg-green/10 text-green ml-auto rounded-full border px-2 py-0.5 text-xs">
            open
          </span>
        )}
      </div>
      <p className="text-muted mb-6 text-sm">
        While STRAT trades above its backing, the Treasury may sell some of its
        own. Anyone can run it, and whoever sends the transaction keeps a share
        of what the premium earned.
      </p>

      <div className="border-border bg-dark mb-4 space-y-2 rounded-lg border p-4">
        <Row
          label="Premium over NAV"
          value={premiumPct === null ? '—' : `${smartFormatter(premiumPct)}%`}
          sub={bandIndex === null ? undefined : `band ${bandIndex + 1}`}
        />
        <Row
          label="This sale would sell"
          value={`${smartFormatter(sellsStrat)} STRAT`}
          sub={
            limitedByLiquidity
              ? `pool limit · window allows ${smartFormatter(allowedThisWindowStrat)}`
              : undefined
          }
        />
        <Row
          label="Treasury receives"
          value={`${smartFormatter(treasuryGetsBtc)} BTC`}
          sub={
            treasuryGetsUsd === null
              ? undefined
              : `≈ $${smartFormatter(treasuryGetsUsd)}`
          }
        />
        <Row
          label="Your reward"
          value={`≈ ${smartFormatter(rewardBtc)} BTC`}
          sub={
            rewardUsd === null ? undefined : `≈ $${smartFormatter(rewardUsd)}`
          }
          accent
        />
      </div>

      {/* The window stops one caller from emptying the reserve in a block. */}
      <div className="mb-4">
        <div className="text-muted mb-1 flex flex-wrap justify-between gap-x-3 text-xs">
          <span>
            Sold this window: {smartFormatter(soldThisWindowStrat)} /{' '}
            {smartFormatter(windowCapStrat)} STRAT
          </span>
          {windowEndsAt !== null && (
            <span>resets in {timeUntil(windowEndsAt)}</span>
          )}
        </div>
        <div className="bg-dark border-border h-1.5 w-full overflow-hidden rounded-full border">
          <div
            className="bg-orange h-full rounded-full transition-all"
            style={{ width: `${soldPct}%` }}
          />
        </div>
      </div>

      {reason && <p className="text-muted mb-4 text-xs">{reason}</p>}

      {limitedByLiquidity && !reason && (
        <p className="text-muted mb-4 text-xs">
          The pool is what caps this one, not the band: the size above is the
          largest the chain accepted when asked. The rest of the allowance for
          this window stays available as liquidity deepens.
        </p>
      )}

      {error && (
        <p className="text-red mb-4 break-all text-xs">
          {describeError(error).detail}
        </p>
      )}

      <Button
        onClick={() => void execute()}
        disabled={!canExecute}
        className="bg-orange hover:bg-orange/80 mt-auto w-full text-black"
      >
        {(isProcessing || isSizing) && <Loader2 className="animate-spin" />}
        {label}
      </Button>
    </Card>
  );
}
