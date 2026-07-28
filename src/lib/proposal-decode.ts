import type { AbiFunction } from 'viem';
import {
  decodeFunctionData,
  formatUnits,
  slice,
  toFunctionSelector,
  type Address,
} from 'viem';

import { AUTHORITY_ABI } from './abi/authority';
import {
  PROPOSAL_ACTIONS,
  type FieldKind,
  type ProposalAction,
} from './proposal-actions';

/** Decodes proposals with the same catalogue that builds them; anything unrecognised falls back to hex, never throws. */

export type DecodedArg = {
  label: string;
  value: string;
};

export type DecodedCall = {
  target: Address;
  selector: `0x${string}`;
  action: ProposalAction | null;
  functionName: string | null;
  args: DecodedArg[];
  calldata: `0x${string}`;
  opaque: boolean;
};

export const formatField = (kind: FieldKind, value: unknown): string => {
  try {
    switch (kind) {
      case 'bps':
        return `${Number(value as bigint) / 100}%`;
      case 'btc':
        return `${formatUnits(value as bigint, 8)} cbBTC`;
      case 'strat':
        return `${formatUnits(value as bigint, 18)} STRAT`;
      case 'wad':
        return formatUnits(value as bigint, 18);
      case 'days': {
        const seconds = Number(value as bigint);
        const days = seconds / 86_400;
        if (days < 1) return `${(seconds / 3600).toFixed(1)} hours`;
        return days === 1 ? '1 day' : `${days} days`;
      }
      case 'seconds':
        return `${Number(value as bigint)} s`;
      case 'datetime': {
        const at = new Date(Number(value as bigint) * 1000);
        return Number.isNaN(at.getTime())
          ? String(value)
          : `${at.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
      }
      case 'bool':
        return value ? 'yes' : 'no';
      case 'uint':
        return String(value);
      case 'address':
      case 'hex':
        return String(value);
    }
  } catch {
    return String(value);
  }
};

const actionFor = (
  target: Address,
  selector: `0x${string}`,
): ProposalAction | null =>
  PROPOSAL_ACTIONS.find((candidate) => {
    if (candidate.target.toLowerCase() !== target.toLowerCase()) return false;
    try {
      const entry = candidate.abi.find(
        (item): item is AbiFunction =>
          item.type === 'function' && item.name === candidate.functionName,
      );
      return entry ? toFunctionSelector(entry) === selector : false;
    } catch {
      return false;
    }
  }) ?? null;

export const decodeCall = (
  governorTarget: Address,
  governorCalldata: `0x${string}`,
): DecodedCall => {
  const opaque = (target: Address, calldata: `0x${string}`): DecodedCall => ({
    target,
    selector:
      calldata.length >= 10 ? slice(calldata, 0, 4) : ('0x' as `0x${string}`),
    action: null,
    functionName: null,
    args: [],
    calldata,
    opaque: true,
  });

  let target: Address;
  let calldata: `0x${string}`;
  try {
    const outer = decodeFunctionData({
      abi: AUTHORITY_ABI,
      data: governorCalldata,
    });
    if (outer.functionName !== 'execute' || !outer.args) {
      return opaque(governorTarget, governorCalldata);
    }
    [target, calldata] = outer.args as [Address, `0x${string}`];
  } catch {
    return opaque(governorTarget, governorCalldata);
  }

  if (calldata.length < 10) return opaque(target, calldata);
  const selector = slice(calldata, 0, 4);

  const action = actionFor(target, selector);
  if (!action) {
    return {
      target,
      selector,
      action: null,
      functionName: null,
      args: [],
      calldata,
      opaque: false,
    };
  }

  try {
    const inner = decodeFunctionData({ abi: action.abi, data: calldata });
    const values = (inner.args ?? []) as readonly unknown[];
    return {
      target,
      selector,
      action,
      functionName: action.functionName,
      args: action.fields.map((field, i) => ({
        label: field.label,
        value: formatField(field.kind, values[i]),
      })),
      calldata,
      opaque: false,
    };
  } catch {
    // Known selector, but the arguments do not fit, e.g. a hand-built proposal.
    return {
      target,
      selector,
      action,
      functionName: action.functionName,
      args: [],
      calldata,
      opaque: false,
    };
  }
};

export const decodeProposalCalls = (
  targets: readonly Address[],
  calldatas: readonly `0x${string}`[],
): DecodedCall[] =>
  calldatas.map((calldata, i) =>
    decodeCall(targets[i] ?? ('0x' as Address), calldata),
  );
