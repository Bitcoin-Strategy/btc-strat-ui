import { useState } from 'react';
import { encodeFunctionData } from 'viem';

import { Button, Card, Input } from '../../components/ui';
import { useProposeAction } from '../../hooks/use-propose';
import { TRACKS, formatDuration, trackFor } from '../../lib/governance';
import {
  PROPOSAL_ACTIONS,
  encodeField,
  fieldError,
  type ProposalAction,
} from '../../lib/proposal-actions';
import { formatVotes } from '../../lib/utils';

function FieldInput({
  id,
  field,
  value,
  onChange,
}: {
  id: string;
  field: ProposalAction['fields'][number];
  value: string;
  onChange: (next: string) => void;
}) {
  if (field.kind === 'bool') {
    return (
      <select
        id={id}
        value={value || 'false'}
        onChange={(e) => onChange(e.target.value)}
        className="border-border bg-dark w-full rounded-lg border p-2 font-mono text-sm text-white"
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  return (
    <Input
      id={id}
      type={field.kind === 'datetime' ? 'datetime-local' : 'text'}
      value={value}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="font-mono"
    />
  );
}

/** Proposals are built from a catalogue so voters read actions, not hex; a raw call covers the rest. */
export function NewProposal({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [actionKey, setActionKey] = useState(PROPOSAL_ACTIONS[0].key);
  const [values, setValues] = useState<Record<string, string>>({});
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [rawTarget, setRawTarget] = useState('');
  const [rawData, setRawData] = useState('');

  const isRaw = actionKey === 'raw';
  const action = PROPOSAL_ACTIONS.find((a) => a.key === actionKey);
  const track = isRaw ? 'upgrade' : (action?.track ?? 'params');

  const {
    propose,
    isConnected,
    isSubmitting,
    error,
    threshold,
    votes,
    voteLookback,
    meetsThreshold,
    isCheckingEligibility,
  } = useProposeAction(track);

  const buildCall = ():
    | { ok: true; target: `0x${string}`; calldata: `0x${string}` }
    | { ok: false; reason: string } => {
    if (isRaw) {
      if (!/^0x[0-9a-fA-F]{40}$/.test(rawTarget.trim()))
        return { ok: false, reason: 'A target address is needed' };
      if (!/^0x[0-9a-fA-F]+$/.test(rawData.trim()))
        return { ok: false, reason: 'Call data is needed' };
      return {
        ok: true,
        target: rawTarget.trim() as `0x${string}`,
        calldata: rawData.trim() as `0x${string}`,
      };
    }

    if (!action) return { ok: false, reason: 'Pick an action' };

    const args: unknown[] = [];
    for (const field of action.fields) {
      const raw = values[field.name] ?? '';
      const problem = fieldError(field.kind, raw);
      if (problem) return { ok: false, reason: `${field.label}: ${problem}` };
      args.push(encodeField(field.kind, raw));
    }

    try {
      return {
        ok: true,
        target: action.target,
        calldata: encodeFunctionData({
          abi: action.abi,
          functionName: action.functionName,
          args,
        }),
      };
    } catch (err) {
      return {
        ok: false,
        reason:
          err instanceof Error ? err.message : 'Could not encode the call',
      };
    }
  };

  const encoded = buildCall();

  const canSubmit =
    isConnected &&
    meetsThreshold &&
    !isCheckingEligibility &&
    encoded.ok &&
    !!title.trim() &&
    !isSubmitting;

  const submit = async () => {
    if (!encoded.ok) return;
    const description = body.trim()
      ? `${title.trim()}\n${body.trim()}`
      : title.trim();
    const hash = await propose(
      [{ target: encoded.target, calldata: encoded.calldata }],
      description,
    );
    if (hash) {
      setOpen(false);
      setTitle('');
      setBody('');
      setValues({});
      onCreated?.();
    }
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="bg-orange hover:bg-orange/80 text-black"
      >
        New proposal
      </Button>
    );
  }

  return (
    <Card className="mb-6 p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-bold text-white">New proposal</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-muted text-sm hover:text-white"
        >
          Cancel
        </button>
      </div>

      <label
        htmlFor="proposal-action"
        className="text-muted mb-1 block text-xs uppercase"
      >
        Action
      </label>
      <select
        id="proposal-action"
        value={actionKey}
        onChange={(e) => {
          setActionKey(e.target.value);
          setValues({});
        }}
        className="border-border bg-dark mb-2 w-full rounded-lg border p-2 text-sm text-white"
      >
        {TRACKS.map((t) => (
          <optgroup key={t.key} label={`${t.label} track`}>
            {PROPOSAL_ACTIONS.filter((a) => a.track === t.key).map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </optgroup>
        ))}
        <optgroup label="Anything else">
          <option value="raw">Raw call — target and calldata</option>
        </optgroup>
      </select>

      {action && <p className="text-muted mb-4 text-sm">{action.summary}</p>}
      {isRaw && (
        <p className="text-muted mb-4 text-sm">
          A call this screen does not describe. It goes through the upgrade
          track, which is the only one the authority accepts restricted
          selectors from — a call that needed only the parameter track will
          still work, just with the higher bar.
        </p>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {isRaw ? (
          <>
            <div>
              <label
                htmlFor="raw-target"
                className="text-muted mb-1 block text-xs"
              >
                Target
              </label>
              <Input
                id="raw-target"
                value={rawTarget}
                placeholder="0x…"
                onChange={(e) => setRawTarget(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <label
                htmlFor="raw-calldata"
                className="text-muted mb-1 block text-xs"
              >
                Calldata
              </label>
              <Input
                id="raw-calldata"
                value={rawData}
                placeholder="0x…"
                onChange={(e) => setRawData(e.target.value)}
                className="font-mono"
              />
            </div>
          </>
        ) : (
          action?.fields.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={`field-${field.name}`}
                className="text-muted mb-1 block text-xs"
              >
                {field.label}
              </label>
              <FieldInput
                id={`field-${field.name}`}
                field={field}
                value={values[field.name] ?? ''}
                onChange={(next) =>
                  setValues((prev) => ({ ...prev, [field.name]: next }))
                }
              />
              {field.help && (
                <div className="text-muted mt-1 text-[11px]">{field.help}</div>
              )}
            </div>
          ))
        )}
      </div>

      <label
        htmlFor="proposal-title"
        className="text-muted mb-1 block text-xs uppercase"
      >
        Title
      </label>
      <Input
        id="proposal-title"
        value={title}
        placeholder="MIP-1: switch redemption on"
        onChange={(e) => setTitle(e.target.value)}
        className="mb-3"
      />

      <label
        htmlFor="proposal-rationale"
        className="text-muted mb-1 block text-xs uppercase"
      >
        Rationale
      </label>
      <textarea
        id="proposal-rationale"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Why this, why now, and what it changes."
        className="border-border bg-dark mb-4 w-full rounded-lg border p-3 text-sm text-white"
      />

      {/* The description hash and calldata are final once submitted. */}
      <div className="border-border bg-dark mb-4 rounded-lg border p-3">
        <div className="text-muted mb-1 text-xs uppercase">The call</div>
        {encoded.ok ? (
          <div className="break-all font-mono text-[11px] text-white">
            <div>
              authority.execute(
              <span className="text-orange">{encoded.target}</span>,
            </div>
            <div className="text-muted pl-4">{encoded.calldata}</div>
            <div>)</div>
          </div>
        ) : (
          <div className="text-muted text-xs">{encoded.reason}</div>
        )}
      </div>

      {!isConnected && (
        <p className="text-muted mb-3 text-xs">Connect a wallet to propose.</p>
      )}
      {isConnected && isCheckingEligibility && (
        <p className="text-muted mb-3 text-xs">
          Reading what this track requires…
        </p>
      )}
      {isConnected && !isCheckingEligibility && !meetsThreshold && (
        <p className="text-orange mb-3 text-xs">
          Proposing on the {trackFor(track).label.toLowerCase()} track needs{' '}
          {formatVotes(threshold ?? 0n)} delegated STRAT. This wallet weighs{' '}
          {formatVotes(votes ?? 0n)} here
          {voteLookback > 0n
            ? `, because this track counts weight as it stood ${formatDuration(
                Number(voteLookback),
              )} ago rather than now`
            : ''}
          .
        </p>
      )}
      {error && (
        <p className="text-red mb-3 break-words text-xs">{error.detail}</p>
      )}

      <Button
        onClick={() => void submit()}
        disabled={!canSubmit}
        className="bg-orange hover:bg-orange/80 w-full text-black"
      >
        {isSubmitting
          ? 'Submitting…'
          : `Propose on the ${trackFor(track).label} track`}
      </Button>
    </Card>
  );
}
