import { getAbiItem, toFunctionSelector, type AbiFunction } from 'viem';
import { useReadContracts } from 'wagmi';

import { AUTHORITY_ABI } from '../lib/abi/authority';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';
import type { TrackKey } from '../lib/governance';
import { PROPOSAL_ACTIONS } from '../lib/proposal-actions';

const selectorOf = (action: (typeof PROPOSAL_ACTIONS)[number]) =>
  toFunctionSelector(
    getAbiItem({ abi: action.abi, name: action.functionName }) as AbiFunction,
  );

/**
 * The track each action must take now. A parameter-track action whose selector the authority has
 * restricted (createSeries and the premium-sale routing, once Genesis is sealed) moves to the upgrade
 * track, since a parameter-track proposal for it would pass its vote and then revert on execution.
 */
export const useActionTracks = (): Record<string, TrackKey> => {
  const { data } = useReadContracts({
    contracts: PROPOSAL_ACTIONS.map((action) => ({
      chainId: PROTOCOL_CHAIN.id,
      address: ADDRESSES.AUTHORITY,
      abi: AUTHORITY_ABI,
      functionName: 'restricted' as const,
      args: [action.target, selectorOf(action)] as const,
    })),
  });

  return Object.fromEntries(
    PROPOSAL_ACTIONS.map((action, i) => [
      action.key,
      action.track === 'params' && data?.[i]?.result === true
        ? 'upgrade'
        : action.track,
    ]),
  );
};
