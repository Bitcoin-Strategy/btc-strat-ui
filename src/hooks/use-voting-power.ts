import { useState } from 'react';
import { zeroAddress } from 'viem';
import {
  useAccount,
  usePublicClient,
  useReadContracts,
  useWriteContract,
} from 'wagmi';

import { useEnsureProtocolChain } from './use-ensure-chain';

import { STAKING_ABI } from '../lib/abi/staking';
import { STRAT_ABI } from '../lib/abi/strat';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';
import { notifyTransaction } from '../lib/notifications';
import { wadToNumber } from '../lib/units';

/** Delegates both the wallet balance and the stake escrow, so weight never stays with an old delegate. */
export const useVotingPower = () => {
  const { address } = useAccount();
  const ensureChain = useEnsureProtocolChain();
  const client = usePublicClient({ chainId: PROTOCOL_CHAIN.id });
  const { writeContractAsync } = useWriteContract();
  const [isDelegating, setIsDelegating] = useState(false);

  const base = {
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.STRAT,
    abi: STRAT_ABI,
  } as const;

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        ...base,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
      {
        ...base,
        functionName: 'getVotes',
        args: address ? [address] : undefined,
      },
      {
        ...base,
        functionName: 'delegates',
        args: address ? [address] : undefined,
      },
      {
        chainId: PROTOCOL_CHAIN.id,
        address: ADDRESSES.STAKING,
        abi: STAKING_ABI,
        functionName: 'escrowOf',
        args: address ? [address] : undefined,
      },
    ],
    query: { enabled: !!address },
  });

  const balanceWad = (data?.[0]?.result as bigint | undefined) ?? 0n;
  const votesWad = (data?.[1]?.result as bigint | undefined) ?? 0n;
  const delegate =
    (data?.[2]?.result as `0x${string}` | undefined) ?? zeroAddress;
  const escrow =
    (data?.[3]?.result as `0x${string}` | undefined) ?? zeroAddress;
  const hasEscrow = escrow !== zeroAddress;

  const hasDelegated = delegate !== zeroAddress;
  const delegatedToSelf =
    hasDelegated &&
    !!address &&
    delegate.toLowerCase() === address.toLowerCase();

  // Two calls when the staker has an escrow. Reads refresh only once both are mined.
  const delegateTo = async (to?: `0x${string}`) => {
    if (!address || !client) return;
    const target = to ?? address;
    setIsDelegating(true);
    try {
      await ensureChain();
      const hash = await writeContractAsync({
        chainId: PROTOCOL_CHAIN.id,
        address: ADDRESSES.STRAT,
        abi: STRAT_ABI,
        functionName: 'delegate',
        args: [target],
      });
      const mined = async (h: `0x${string}`) => {
        const receipt = await client.waitForTransactionReceipt({ hash: h });
        if (receipt.status !== 'success')
          throw new Error('Transaction reverted');
      };
      await mined(hash);

      let last = hash;
      if (hasEscrow) {
        last = await writeContractAsync({
          chainId: PROTOCOL_CHAIN.id,
          address: ADDRESSES.STAKING,
          abi: STAKING_ABI,
          functionName: 'delegateStake',
          args: [target],
        });
        await mined(last);
      }

      await refetch();
      notifyTransaction.success('vote', last, 'Voting power delegated');
    } catch (err) {
      notifyTransaction.error('vote', err);
    } finally {
      setIsDelegating(false);
    }
  };

  return {
    balance: wadToNumber(balanceWad),
    votes: wadToNumber(votesWad),
    undelegated: hasDelegated ? 0 : wadToNumber(balanceWad),
    delegate,
    escrow,
    hasEscrow,
    hasDelegated,
    delegatedToSelf,
    delegateTo,
    isDelegating,
    isLoading,
    error,
    refetch,
  };
};
