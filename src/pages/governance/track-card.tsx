import { Clock, Info } from 'lucide-react';

import type { TrackConfig } from '../../hooks/use-governance-config';
import { formatDuration } from '../../lib/governance';
import { formatVotes } from '../../lib/utils';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="font-mono text-xs text-white">{value}</dd>
    </div>
  );
}

/** Values are read from the governor. `yourVotes` is lookback-adjusted, not the current balance. */
export function TrackCard({
  config,
  yourVotes,
  isConnected,
}: {
  config: TrackConfig;
  yourVotes: bigint | undefined;
  isConnected: boolean;
}) {
  const lookback = Number(config.voteLookback);
  const canPropose = yourVotes !== undefined && yourVotes >= config.threshold;

  return (
    <div className="border-border bg-card rounded-xl border p-5">
      <h3 className="font-bold text-white">{config.label} track</h3>
      <p className="text-muted mb-3 mt-1 text-xs">{config.blurb}</p>

      <dl className="space-y-1.5">
        <Row label="Quorum" value={`${formatVotes(config.quorum)} votes`} />
        <Row
          label="Support needed"
          value={`${Number(config.majorityBps) / 100}%`}
        />
        <Row
          label="To propose"
          value={`${formatVotes(config.threshold)} votes`}
        />
        <Row
          label="Voting opens"
          value={
            config.votingDelay === 0n
              ? 'immediately'
              : `after ${formatDuration(Number(config.votingDelay))}`
          }
        />
        <Row
          label="Voting runs for"
          value={formatDuration(Number(config.votingPeriod))}
        />
        {config.lateQuorumExtension > 0n && (
          <Row
            label="Late-quorum extension"
            value={formatDuration(Number(config.lateQuorumExtension))}
          />
        )}
        <Row
          label="Timelock delay"
          value={formatDuration(Number(config.timelockDelay))}
        />
      </dl>

      {lookback > 0 && (
        <div className="border-border bg-dark mt-3 flex items-start gap-2 rounded-lg border p-3">
          <Clock size={14} className="text-orange mt-0.5 shrink-0" />
          <div className="text-muted text-xs">
            <span className="font-semibold text-white">
              Weight is counted {formatDuration(lookback)} in the past.
            </span>{' '}
            STRAT acquired more recently than that carries no weight on this
            track, however it was acquired and however long it has been
            delegated. It is what stops an upgrade being bought: the weight has
            to have existed before the proposal did.
          </div>
        </div>
      )}

      {isConnected && (
        <div className="border-border mt-3 border-t pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-muted text-xs">
              Your weight {lookback > 0 ? 'here' : ''}
            </span>
            <span
              className={`font-mono text-sm ${canPropose ? 'text-green' : 'text-white'}`}
            >
              {yourVotes === undefined ? '—' : formatVotes(yourVotes)}
            </span>
          </div>
          {yourVotes !== undefined && !canPropose && (
            <div className="text-muted mt-1 text-[11px]">
              {formatVotes(config.threshold - yourVotes)} short of the threshold
              to propose here. You can still vote with whatever weight you have.
            </div>
          )}
        </div>
      )}

      {!isConnected && (
        <div className="text-muted mt-3 flex items-center gap-1.5 text-[11px]">
          <Info size={12} /> Connect a wallet to see your weight on this track.
        </div>
      )}
    </div>
  );
}
