import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useReadContract } from 'wagmi';

import { useFinalizeGenesis } from '../../hooks/use-finalize-genesis';
import { useProtocolAuthority } from '../../hooks/use-protocol-authority';
import { TREASURY_ABI } from '../../lib/abi/treasury';
import { ADDRESSES } from '../../lib/addresses';
import { PROTOCOL_CHAIN } from '../../lib/chains';
import { describeError } from '../../lib/errors';
import { formatDuration } from '../../lib/utils';

// Typed in full so a misclick cannot end Genesis.
const CONFIRMATION = 'HAND OVER TO THE DAO';

/** Ends Genesis. Irreversible. */
export function HandOverCard({
  isCorrectNetwork,
}: {
  isCorrectNetwork: boolean;
}) {
  const [typed, setTyped] = useState('');
  const { guardianExpiry, guardianPeriod } = useProtocolAuthority();

  // The guardian period starts at this transaction, so only its length is known.
  const guardianTerm = (() => {
    if (guardianExpiry) {
      return `until ${new Date(Number(guardianExpiry) * 1000).toLocaleString()}`;
    }
    if (guardianPeriod) {
      return `for ${(Number(guardianPeriod) / 86_400).toFixed(0)} days from this transaction`;
    }
    return 'until its own expiry';
  })();
  const {
    finalize,
    step,
    isPending,
    isConfirming,
    isSuccess,
    error,
    canFinalize,
  } = useFinalizeGenesis();

  const { data: redemptionDelay } = useReadContract({
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.TREASURY,
    abi: TREASURY_ABI,
    functionName: 'REDEMPTION_DELAY',
  });

  const lockUp =
    redemptionDelay === undefined
      ? 'the Treasury lock-up'
      : formatDuration(Number(redemptionDelay));

  const busy = isPending || isConfirming;
  const confirmed = typed.trim().toUpperCase() === CONFIRMATION;
  const enabled = canFinalize && confirmed && isCorrectNetwork && !busy;

  const label = (() => {
    if (isSuccess) return 'Handed over';
    if (isConfirming) return 'Confirming…';
    if (isPending) return `${step ?? 'Waiting for the wallet'}…`;
    return 'Finalize Genesis';
  })();

  return (
    <div className="border-red/30 bg-red/5 rounded-xl border p-5">
      <div className="mb-3 flex items-start gap-3">
        <AlertTriangle className="text-red mt-0.5 shrink-0" size={20} />
        <div className="min-w-0">
          <h3 className="font-bold text-white">Hand the protocol to the DAO</h3>
          <p className="text-muted mt-1 text-sm">
            One call, in one direction. There is no way back and no second
            admin.
          </p>
        </div>
      </div>

      <ul className="text-muted mb-4 space-y-1.5 text-sm">
        <li>
          First it seals Genesis, one transaction each: the last bond series is
          cut to what has sold and closed, and opening new series and
          premium-sale routing move to the{' '}
          <span className="text-white">upgrade track</span>.
        </li>
        <li>
          Your admin address is <span className="text-white">zeroed</span> in
          the same transaction. Nothing restores it.
        </li>
        <li>
          The parameter timelock becomes the controller of every module. Each
          setting on this page turns into a governance proposal.
        </li>
        <li>
          The countdown to redemptions opening starts:{' '}
          <span className="text-white">{lockUp}</span> during which no bitcoin
          may leave the Treasury.
        </li>
        <li>
          The guardian keeps its pause and cancel rights {guardianTerm}, then
          stops being anyone at all.
        </li>
      </ul>

      <label
        htmlFor="handover-confirm"
        className="text-muted mb-1.5 block text-xs"
      >
        Type <span className="text-white">{CONFIRMATION}</span> to enable the
        button
      </label>
      <input
        id="handover-confirm"
        type="text"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={CONFIRMATION}
        autoComplete="off"
        disabled={!canFinalize || busy}
        className="border-border bg-dark focus:border-red mb-3 w-full rounded-lg border p-3 font-mono text-sm text-white focus:outline-none disabled:opacity-50"
      />

      <button
        onClick={() => void finalize()}
        disabled={!enabled}
        className="border-red/50 bg-red/20 text-red hover:bg-red disabled:hover:bg-red/20 disabled:hover:text-red w-full rounded-lg border py-3 font-bold transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {label}
      </button>

      {!isCorrectNetwork && (
        <p className="text-muted mt-2 text-center text-xs">
          Switch to {PROTOCOL_CHAIN.name} first.
        </p>
      )}
      {error && (
        <p className="text-red mt-2 text-center text-xs">
          {describeError(error).detail}
        </p>
      )}
    </div>
  );
}
