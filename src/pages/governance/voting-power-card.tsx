import { AlertCircle, Info } from 'lucide-react';
import { useAccount } from 'wagmi';

import { useVotingPower } from '../../hooks/use-voting-power';
import { explorerAddress } from '../../lib/addresses';

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(2);
};

/** Weight must be delegated to count, and the stake escrow delegates separately; this delegates both. */
export function VotingPowerCard() {
  const { isConnected } = useAccount();
  const {
    votes,
    balance,
    undelegated,
    hasDelegated,
    delegatedToSelf,
    delegate,
    hasEscrow,
    delegateTo,
    isDelegating,
  } = useVotingPower();

  const label = (() => {
    if (isDelegating) return 'Delegating…';
    if (delegatedToSelf) return 'Delegated to yourself';
    if (hasDelegated) return 'Redelegate to myself';
    return 'Delegate to myself';
  })();

  return (
    <div className="border-border bg-card rounded-xl border p-5 lg:sticky lg:top-24">
      <h3 className="mb-4 font-bold text-white">Your voting power</h3>
      <div className="mb-1 font-mono text-2xl text-white sm:text-3xl">
        {isConnected ? fmt(votes) : '—'}
      </div>
      <div className="text-muted mb-4 text-xs">
        delegated STRAT · balance {isConnected ? fmt(balance) : '—'}
      </div>

      {!isConnected && (
        <div className="text-muted flex items-start gap-1.5 text-xs">
          <Info size={13} className="mt-0.5 shrink-0" />
          Connect a wallet to see your weight, delegate it and vote.
        </div>
      )}

      {/* Undelegated balances count zero. */}
      {isConnected && !hasDelegated && balance > 0 && (
        <div className="border-orange/20 bg-orange/10 mb-3 rounded-lg border p-3">
          <div className="text-orange flex items-center gap-1.5 text-sm font-semibold">
            <AlertCircle size={14} />
            {fmt(undelegated)} STRAT counts for nobody
          </div>
          <div className="text-orange/80 mt-1 text-xs">
            Delegate it, to yourself or to someone else, and it starts voting.
            Staking does not cost you the vote: a stake sits in your own escrow
            and delegates with you, so one delegation here points both halves of
            your weight.
          </div>
        </div>
      )}

      {isConnected && (
        <button
          disabled={isDelegating || delegatedToSelf}
          onClick={() => void delegateTo()}
          className="border-border bg-dark mb-2 w-full rounded-lg border py-2 text-sm text-white disabled:opacity-40"
        >
          {label}
        </button>
      )}

      {isConnected && hasEscrow && (
        <div className="text-muted mb-2 text-[11px]">
          You have a stake, so delegating sends two transactions: one for the
          wallet&rsquo;s balance and one for the escrow holding the stake.
        </div>
      )}

      {hasDelegated && !delegatedToSelf && (
        <div className="text-muted text-center text-xs">
          Currently delegated to{' '}
          <a
            href={explorerAddress(delegate)}
            target="_blank"
            rel="noreferrer"
            className="hover:text-orange break-all font-mono"
          >
            {delegate}
          </a>
        </div>
      )}
    </div>
  );
}
