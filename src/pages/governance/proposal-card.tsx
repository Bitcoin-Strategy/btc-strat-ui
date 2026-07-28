import { AlertCircle, Check, ChevronDown, ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';

import { ProposalCalls } from './proposal-calls';

import { useChainTime } from '../../hooks/use-chain-time';
import type { TrackConfig } from '../../hooks/use-governance-config';
import type { Proposal } from '../../hooks/use-proposals';
import { useTx } from '../../hooks/use-tx';
import { GOVERNOR_ABI } from '../../lib/abi/governor';
import { explorerAddress } from '../../lib/addresses';
import { PROTOCOL_CHAIN } from '../../lib/chains';
import {
  VOTE,
  canExecute,
  canQueue,
  canVote,
  formatDuration,
  secondsUntil,
  trackFor,
  type VoteSupport,
} from '../../lib/governance';
import { REFRESH, STALE } from '../../lib/refresh';
import { cn, formatVotes } from '../../lib/utils';

const STATE_TONE: Record<string, string> = {
  Active: 'bg-orange/10 text-orange border-orange/20',
  Succeeded: 'bg-green/10 text-green border-green/20',
  Queued: 'bg-green/10 text-green border-green/20',
  Executed: 'bg-green/10 text-green border-green/20',
  Defeated: 'bg-red/10 text-red border-red/20',
  Canceled: 'bg-red/10 text-red border-red/20',
  Expired: 'bg-red/10 text-red border-red/20',
  Pending: 'bg-card text-muted border-border',
};

const VOTE_LABEL: Record<number, string> = {
  [VOTE.For]: 'for',
  [VOTE.Against]: 'against',
  [VOTE.Abstain]: 'abstain',
};

const STATE_MEANING: Record<string, string> = {
  Pending: 'Created, but voting has not opened yet.',
  Active: 'Open for votes.',
  Succeeded: 'Passed. Anyone may now queue it in the timelock.',
  Queued: 'Waiting out the timelock before it can run.',
  Executed: 'Done. The calls below have run.',
  Defeated: 'It did not reach quorum, or not enough of the votes were for it.',
  Canceled: 'Withdrawn before it could run.',
  Expired: 'It passed and was queued, but nobody executed it in time.',
};

/** Always shows both quorum and majority: they fail independently. */
const verdictOf = (prop: Proposal): { tone: string; text: string } | null => {
  if (prop.state !== 'Active' && prop.state !== 'Pending') return null;

  const missingQuorum = prop.quorum - prop.countedVotes;

  if (!prop.hasQuorum && !prop.hasMajority) {
    return {
      tone: 'text-muted',
      text: `Short of quorum by ${formatVotes(missingQuorum)} votes, and below the ${prop.requiredShare}% support this track requires.`,
    };
  }
  if (!prop.hasQuorum) {
    return {
      tone: 'text-orange',
      text: `Has the support, but is ${formatVotes(missingQuorum)} votes short of quorum. Only "for" and "abstain" count towards it.`,
    };
  }
  if (!prop.hasMajority) {
    return {
      tone: 'text-orange',
      text: `Has quorum, but ${prop.forShare.toFixed(1)}% of decisive votes are for it and this track requires ${prop.requiredShare}%.`,
    };
  }
  return {
    tone: 'text-green',
    text: 'Passing on both counts as it stands. It can still change while voting is open.',
  };
};

/** `etaRemaining` is the timelock clock, which gates Execute. */
const timingOf = (
  prop: Proposal,
  now: number,
  etaRemaining: number,
): string => {
  if (prop.state === 'Active') {
    const left = secondsUntil(prop.voteEndsAt, now);
    return left > 0
      ? `voting ends in ${formatDuration(left)}`
      : 'voting closed';
  }
  if (prop.state === 'Pending') {
    const left = secondsUntil(prop.voteStart, now);
    return left > 0 ? `opens in ${formatDuration(left)}` : 'opening';
  }
  if (canExecute(prop.state) && etaRemaining > 0) {
    return `executable in ${formatDuration(etaRemaining)}`;
  }
  return '';
};

/** Each action is shown only in the window where the chain accepts it. */
function ProposalActions({
  prop,
  config,
  tx,
  address,
  hasVoted,
  executable,
  etaRemaining,
  onVote,
  onCarry,
}: {
  prop: Proposal;
  config?: TrackConfig;
  tx: ReturnType<typeof useTx>;
  address?: `0x${string}`;
  hasVoted?: boolean;
  executable: boolean;
  etaRemaining: number;
  onVote: (support: VoteSupport) => void;
  onCarry: (fn: 'queue' | 'execute') => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {canVote(prop.state) &&
        (hasVoted ? (
          <span className="text-green flex items-center gap-1.5 text-xs">
            <Check size={14} /> You have voted on this
          </span>
        ) : (
          <>
            <button
              disabled={tx.isBusy || !address}
              onClick={() => onVote(VOTE.For)}
              className="border-green/30 text-green hover:bg-green/10 rounded-lg border px-4 py-1.5 text-sm disabled:opacity-40"
            >
              {tx.pending === 'for' ? 'Voting…' : 'For'}
            </button>
            <button
              disabled={tx.isBusy || !address}
              onClick={() => onVote(VOTE.Against)}
              className="border-red/30 text-red hover:bg-red/10 rounded-lg border px-4 py-1.5 text-sm disabled:opacity-40"
            >
              {tx.pending === 'against' ? 'Voting…' : 'Against'}
            </button>
            {/* Abstain counts toward quorum without taking a side. */}
            <button
              disabled={tx.isBusy || !address}
              onClick={() => onVote(VOTE.Abstain)}
              className="border-border text-muted hover:border-muted rounded-lg border px-4 py-1.5 text-sm hover:text-white disabled:opacity-40"
            >
              {tx.pending === 'abstain' ? 'Voting…' : 'Abstain'}
            </button>
            {!address && (
              <span className="text-muted text-xs">
                Connect a wallet to vote.
              </span>
            )}
          </>
        ))}

      {/* Queue and execute are permissionless. */}
      {canQueue(prop.state) && (
        <button
          disabled={tx.isBusy}
          onClick={() => onCarry('queue')}
          className="border-border hover:border-orange rounded-lg border px-4 py-1.5 text-sm text-white disabled:opacity-40"
        >
          {tx.pending === 'queue' ? 'Queueing…' : 'Queue in timelock'}
        </button>
      )}
      {canQueue(prop.state) && config && config.timelockDelay > 0n && (
        <span className="text-muted text-xs">
          Anyone may queue it. It then waits{' '}
          {formatDuration(Number(config.timelockDelay))} in the timelock.
        </span>
      )}

      {canExecute(prop.state) && (
        <>
          <button
            disabled={tx.isBusy || !executable}
            onClick={() => onCarry('execute')}
            className="border-border hover:border-orange rounded-lg border px-4 py-1.5 text-sm text-white disabled:opacity-40"
            title={
              executable
                ? undefined
                : 'The timelock has not released this proposal yet'
            }
          >
            {tx.pending === 'execute' ? 'Executing…' : 'Execute'}
          </button>
          {!executable && (
            <span className="text-muted text-xs">
              The timelock releases it in {formatDuration(etaRemaining)}.
              Executing before then is refused by the timelock, not by this
              screen.
            </span>
          )}
        </>
      )}

      <a
        href={explorerAddress(prop.governor)}
        target="_blank"
        rel="noreferrer"
        className="text-muted hover:text-orange ml-auto flex items-center gap-1 text-xs"
      >
        Governor <ExternalLink size={11} />
      </a>
    </div>
  );
}

export function ProposalCard({
  prop,
  config,
}: {
  prop: Proposal;
  config?: TrackConfig;
}) {
  const { address } = useAccount();
  const now = useChainTime();
  const [showCalls, setShowCalls] = useState(false);
  const tx = useTx('vote');
  const track = trackFor(prop.track);

  const { data: hasVoted } = useReadContract({
    chainId: PROTOCOL_CHAIN.id,
    address: prop.governor,
    abi: GOVERNOR_ABI,
    functionName: 'hasVoted',
    args: address ? [prop.id, address] : undefined,
    query: {
      enabled: !!address && canVote(prop.state),
      refetchInterval: REFRESH.slow,
      staleTime: STALE.slow,
    },
  });

  const calls = useMemo(
    () => ({ targets: prop.targets, calldatas: prop.calldatas }),
    [prop.targets, prop.calldatas],
  );

  const vote = (support: VoteSupport) => {
    const label = VOTE_LABEL[support];
    tx.send(label, `Voted ${label}`, {
      chainId: PROTOCOL_CHAIN.id,
      address: prop.governor,
      abi: GOVERNOR_ABI,
      functionName: 'castVote',
      args: [prop.id, support],
    });
  };

  const queueOrExecute = (fn: 'queue' | 'execute') => {
    tx.send(
      fn,
      fn === 'queue' ? 'Queued in the timelock' : 'Proposal executed',
      {
        chainId: PROTOCOL_CHAIN.id,
        address: prop.governor,
        abi: GOVERNOR_ABI,
        functionName: fn,
        args: [
          prop.targets as readonly `0x${string}`[],
          prop.values,
          prop.calldatas,
          prop.descriptionHash,
        ],
      },
    );
  };

  const etaRemaining =
    prop.etaSeconds > 0n ? secondsUntil(prop.etaSeconds, now) : 0;
  const executable = canExecute(prop.state) && etaRemaining <= 0;

  const verdict = verdictOf(prop);
  const timing = timingOf(prop, now, etaRemaining);

  return (
    <div className="border-border bg-card rounded-xl border p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="border-border text-muted rounded border px-2 py-0.5 text-xs">
              {track.label}
            </span>
            <span
              className={cn(
                'rounded border px-2 py-0.5 text-xs',
                STATE_TONE[prop.state] ?? STATE_TONE.Pending,
              )}
            >
              {prop.state}
            </span>
          </div>
          <h3 className="font-semibold text-white">{prop.title}</h3>
          <div className="text-muted mt-0.5 text-xs">
            {STATE_MEANING[prop.state]}
          </div>
          {prop.body && (
            <p className="text-muted mt-2 whitespace-pre-line text-sm">
              {prop.body}
            </p>
          )}
        </div>
        <div className="text-muted shrink-0 text-right text-xs">{timing}</div>
      </div>

      {/* Quorum is an absolute vote count: most supply sits in the Treasury and never delegates. */}
      <div className="mb-4 space-y-3">
        <div>
          <div className="mb-1 flex justify-between gap-3 text-xs">
            <span className="text-muted">Support</span>
            <span className="text-white">
              {prop.forShare.toFixed(1)}%
              <span className="text-muted">
                {' '}
                of {formatVotes(
                  prop.votes.forVotes + prop.votes.againstVotes,
                )}{' '}
                decisive · needs {prop.requiredShare}%
              </span>
            </span>
          </div>
          <div className="bg-dark relative h-2 overflow-hidden rounded">
            <div
              className={cn(
                'h-full',
                prop.hasMajority ? 'bg-green' : 'bg-orange',
              )}
              style={{ width: `${prop.forShare}%` }}
            />
            <div
              className="bg-muted absolute top-0 h-full w-0.5"
              style={{ left: `${prop.requiredShare}%` }}
              aria-hidden
            />
          </div>
          <div className="text-muted mt-1 text-[11px]">
            For {formatVotes(prop.votes.forVotes)} · Against{' '}
            {formatVotes(prop.votes.againstVotes)} · Abstain{' '}
            {formatVotes(prop.votes.abstainVotes)}
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between gap-3 text-xs">
            <span className="text-muted">Quorum</span>
            <span className={prop.hasQuorum ? 'text-green' : 'text-white'}>
              {formatVotes(prop.countedVotes)} / {formatVotes(prop.quorum)}
              <span className="text-muted">
                {' '}
                ·{' '}
                {prop.hasQuorum ? 'reached' : `${prop.quorumShare.toFixed(0)}%`}
              </span>
            </span>
          </div>
          <div className="bg-dark h-2 overflow-hidden rounded">
            <div
              className={cn(
                'h-full',
                prop.hasQuorum ? 'bg-green' : 'bg-orange',
              )}
              style={{ width: `${prop.quorumShare}%` }}
            />
          </div>
          <div className="text-muted mt-1 text-[11px]">
            Counts &ldquo;for&rdquo; and &ldquo;abstain&rdquo;. Votes against do
            not count towards quorum.
          </div>
        </div>
      </div>

      {verdict && (
        <div className={cn('mb-4 text-xs', verdict.tone)}>{verdict.text}</div>
      )}

      <button
        type="button"
        onClick={() => setShowCalls((open) => !open)}
        className="text-muted mb-3 flex items-center gap-1 text-xs hover:text-white"
      >
        <ChevronDown
          size={14}
          className={cn('transition-transform', showCalls && 'rotate-180')}
        />
        {showCalls ? 'Hide' : 'Show'} what this executes (
        {prop.calldatas.length} {prop.calldatas.length === 1 ? 'call' : 'calls'}
        )
      </button>
      {showCalls && (
        <ProposalCalls
          targets={calls.targets}
          calldatas={calls.calldatas}
          proposer={prop.proposer}
        />
      )}

      {tx.error && (
        <div className="border-red/20 bg-red/10 mb-3 flex items-start gap-2 rounded-lg border p-3">
          <AlertCircle size={16} className="text-red mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-red text-sm font-semibold">
              {tx.error.title}
            </div>
            <div className="text-red/80 break-words text-xs">
              {tx.error.detail}
            </div>
          </div>
        </div>
      )}

      <ProposalActions
        prop={prop}
        config={config}
        tx={tx}
        address={address}
        hasVoted={hasVoted as boolean | undefined}
        executable={executable}
        etaRemaining={etaRemaining}
        onVote={vote}
        onCarry={queueOrExecute}
      />
    </div>
  );
}
