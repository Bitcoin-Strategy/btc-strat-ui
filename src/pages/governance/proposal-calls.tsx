import { AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import type { Address } from 'viem';

import { explorerAddress } from '../../lib/addresses';
import { decodeProposalCalls } from '../../lib/proposal-decode';

/** Decodes calls with the proposal catalogue; unknown calls are labelled as such, not guessed. */
export function ProposalCalls({
  targets,
  calldatas,
  proposer,
}: {
  targets: readonly Address[];
  calldatas: readonly `0x${string}`[];
  proposer: Address;
}) {
  const calls = useMemo(
    () => decodeProposalCalls(targets, calldatas),
    [targets, calldatas],
  );

  return (
    <div className="border-border bg-dark mb-3 space-y-3 rounded-lg border p-3">
      {calls.map((call, i) => (
        <div
          key={`${call.target}-${call.selector}-${i}`}
          className="border-border/60 border-b pb-3 last:border-0 last:pb-0"
        >
          {call.action ? (
            <>
              <div className="text-sm font-semibold text-white">
                {call.action.label}
              </div>
              <div className="text-muted mt-0.5 text-xs">
                {call.action.summary}
              </div>
              {call.args.length > 0 ? (
                <dl className="mt-2 space-y-1">
                  {call.args.map((arg) => (
                    <div key={arg.label} className="flex justify-between gap-3">
                      <dt className="text-muted text-xs">{arg.label}</dt>
                      <dd className="font-mono text-xs text-white">
                        {arg.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="text-orange mt-2 text-xs">
                  The call names a known action but its arguments could not be
                  read. Check the raw calldata below before voting.
                </div>
              )}
            </>
          ) : (
            <div className="flex items-start gap-2">
              <AlertTriangle
                size={14}
                className="text-orange mt-0.5 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-orange text-sm font-semibold">
                  {call.opaque
                    ? 'This call could not be decoded'
                    : 'Unrecognised call'}
                </div>
                <div className="text-muted mt-0.5 text-xs">
                  {call.opaque
                    ? 'It is not shaped like a call through ProtocolAuthority, so this screen cannot say what it does. Read the calldata before voting.'
                    : 'The target and selector are not in this app’s catalogue of actions. It may be legitimate; this screen simply cannot explain it. Read the calldata before voting.'}
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 space-y-1">
            <div className="flex justify-between gap-3">
              <span className="text-muted text-[11px]">Target</span>
              <a
                href={explorerAddress(call.target)}
                target="_blank"
                rel="noreferrer"
                className="text-muted hover:text-orange break-all font-mono text-[11px]"
              >
                {call.target}
              </a>
            </div>
            <div>
              <div className="text-muted text-[11px]">Calldata</div>
              <div className="text-muted/70 break-all font-mono text-[10px]">
                {call.calldata}
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="border-border/60 flex justify-between gap-3 border-t pt-2">
        <span className="text-muted text-[11px]">Proposed by</span>
        <a
          href={explorerAddress(proposer)}
          target="_blank"
          rel="noreferrer"
          className="text-muted hover:text-orange break-all font-mono text-[11px]"
        >
          {proposer}
        </a>
      </div>
    </div>
  );
}
