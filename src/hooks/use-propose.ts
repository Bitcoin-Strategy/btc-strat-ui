import { encodeFunctionData, type Address } from 'viem';
import { useAccount } from 'wagmi';

import { useGovernanceConfig } from './use-governance-config';
import { useTx } from './use-tx';

import { AUTHORITY_ABI } from '../lib/abi/authority';
import { GOVERNOR_ABI } from '../lib/abi/governor';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';
import { trackFor, type TrackKey } from '../lib/governance';

export type ProposalCall = {
  target: Address;
  calldata: `0x${string}`;
};

/**
 * Proposals always target `ProtocolAuthority.execute`, since the authority owns every module.
 * The threshold check uses the governor's `getVotes`, which applies `VOTE_LOOKBACK`, not the token's current votes.
 */
export const useProposeAction = (track: TrackKey) => {
  const { isConnected } = useAccount();
  const governor = trackFor(track).address;
  const config = useGovernanceConfig();
  const tx = useTx('vote');

  const trackConfig = config.configOf(track);
  const votes = config.votesOn(track);
  const threshold = trackConfig?.threshold;

  const propose = async (calls: ProposalCall[], description: string) => {
    const calldatas = calls.map((call) =>
      encodeFunctionData({
        abi: AUTHORITY_ABI,
        functionName: 'execute',
        args: [call.target, call.calldata],
      }),
    );

    return tx.send('propose', 'Proposal submitted', {
      chainId: PROTOCOL_CHAIN.id,
      address: governor,
      abi: GOVERNOR_ABI,
      functionName: 'propose',
      args: [
        calls.map(() => ADDRESSES.AUTHORITY),
        calls.map(() => 0n),
        calldatas,
        description,
      ],
    });
  };

  return {
    propose,
    hash: tx.hash,
    isConnected,
    isSubmitting: tx.isBusy,
    error: tx.error,

    /** Raw 18-decimal weight. Undefined until read. */
    threshold,
    votes,
    /** Zero on the parameter track. */
    voteLookback: trackConfig?.voteLookback ?? 0n,
    meetsThreshold:
      votes === undefined || threshold === undefined
        ? false
        : votes >= threshold,
    isCheckingEligibility: votes === undefined || threshold === undefined,
  };
};
