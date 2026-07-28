import { AlertCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useAccount } from 'wagmi';

import { NewProposal } from './new-proposal';
import { ProposalCard } from './proposal-card';
import { TrackCard } from './track-card';
import { VotingPowerCard } from './voting-power-card';

import { useGovernanceConfig } from '../../hooks/use-governance-config';
import { useProposals } from '../../hooks/use-proposals';
import { useProtocolAuthority } from '../../hooks/use-protocol-authority';
import { useReportedError } from '../../hooks/use-reported-error';
import { canVote } from '../../lib/governance';
import { cn } from '../../lib/utils';

type Filter = 'open' | 'all';

export function Governance() {
  const { proposals, isLoading, error, refetch } = useProposals();
  const readError = useReportedError('proposals', error);
  const { isConnected } = useAccount();
  const { genesisFinalized } = useProtocolAuthority();
  const config = useGovernanceConfig();
  const [filter, setFilter] = useState<Filter>('open');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // "Open" means still voting or awaiting execution.
  const open = proposals.filter(
    (prop) =>
      canVote(prop.state) ||
      prop.state === 'Pending' ||
      prop.state === 'Succeeded' ||
      prop.state === 'Queued',
  );
  const shown = filter === 'open' ? open : proposals;
  const openLabel = open.length > 0 ? `Open (${open.length})` : 'Open';

  const emptyMessage = (() => {
    if (proposals.length > 0) {
      return 'Every proposal has run its course. Switch to “All” to read the history.';
    }
    return genesisFinalized
      ? 'Governance is active and nobody has proposed anything. Anyone past the threshold on a track can be the first.'
      : 'Governance opens when the admin finalizes Genesis.';
  })();

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:gap-6">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
            Governance
          </h1>
          <p className="text-muted max-w-2xl">
            Two tracks, one contract deployed twice. What a decision costs is
            the only thing that differs between them — and which track a call
            may take is decided on-chain by the authority, not by the proposer.
          </p>
        </div>
        {genesisFinalized && <NewProposal onCreated={() => void refetch()} />}
      </div>

      {!genesisFinalized && (
        <div className="border-orange/20 bg-orange/10 text-orange mb-6 flex items-start gap-3 rounded-lg border px-4 py-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Genesis is still open</div>
            <div className="text-orange/80 text-sm">
              Proposals are refused until the admin finalizes and hands the
              protocol to the DAO. Until then parameters are owner calls, and
              the tracks below describe what governance will ask once it opens.
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex gap-1">
              {(
                [
                  ['open', openLabel],
                  ['all', `All (${proposals.length})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                    filter === key
                      ? 'border-orange/30 bg-orange/10 text-orange'
                      : 'border-border text-muted hover:text-white',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => void refresh()}
              disabled={isRefreshing}
              className="text-muted flex items-center gap-1.5 text-xs hover:text-white disabled:opacity-40"
            >
              <RefreshCw
                size={13}
                className={isRefreshing ? 'animate-spin' : undefined}
              />
              {isRefreshing ? 'Reading…' : 'Refresh'}
            </button>
          </div>

          <div className="space-y-4">
            {isLoading && (
              <div className="border-border bg-card text-muted rounded-xl border p-8 text-center">
                Reading proposals from chain…
              </div>
            )}

            {error && !isLoading && (
              <div className="border-red/20 bg-red/10 rounded-xl border p-5">
                <div className="text-red flex items-center gap-2 font-semibold">
                  <AlertCircle size={16} /> Could not read proposals
                </div>
                <div className="text-red/80 mt-1 text-sm">
                  {readError?.detail}
                </div>
                <button
                  onClick={() => void refresh()}
                  className="border-red/30 text-red hover:bg-red/10 mt-3 rounded-lg border px-3 py-1.5 text-sm"
                >
                  Try again
                </button>
              </div>
            )}

            {!isLoading && !error && shown.length === 0 && (
              <div className="border-border bg-card rounded-xl border p-8 text-center">
                <div className="text-white">
                  {proposals.length === 0
                    ? 'No proposals yet'
                    : 'Nothing open right now'}
                </div>
                <div className="text-muted mx-auto mt-1 max-w-md text-sm">
                  {emptyMessage}
                </div>
              </div>
            )}

            {shown.map((prop) => (
              <ProposalCard
                key={`${prop.track}-${prop.id}`}
                prop={prop}
                config={config.configOf(prop.track)}
              />
            ))}
          </div>
        </div>

        <div className="w-full shrink-0 space-y-4 lg:w-80">
          <VotingPowerCard />
          {config.tracks.map((track) => (
            <TrackCard
              key={track.key}
              config={track}
              yourVotes={config.votesOn(track.key)}
              isConnected={isConnected}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
