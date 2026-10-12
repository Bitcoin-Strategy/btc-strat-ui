import { useState } from 'react';
import { useConnection, usePublicClient, useWriteContract } from 'wagmi';

import { useEnsureProtocolChain } from './use-ensure-chain';
import { useProtocolAuthority } from './use-protocol-authority';

import { AUTHORITY_ABI } from '../lib/abi/authority';
import { BONDING_ABI } from '../lib/abi/bonding';
import { ADDRESSES } from '../lib/addresses';
import { authorityCall } from '../lib/admin-write';
import { PROTOCOL_CHAIN } from '../lib/chains';
import { DAO_RESERVED_CALLS } from '../lib/genesis-seal';
import { notifyTransaction } from '../lib/notifications';

type Series = {
  capacityMstrat: bigint;
  filledMstrat: bigint;
  vestingTerm: bigint;
  endTime: bigint;
  isActive: boolean;
};

/**
 * Seals Genesis, then finalizes; irreversible. The seal is what `npm run genesis:finalize` does first:
 * the last series is cut to what sold and closed, and the F-06 calls are reserved for the upgrade track.
 * Each step is skipped when already done, so a run interrupted halfway can simply be repeated.
 */
export const useFinalizeGenesis = () => {
  const { address } = useConnection();
  const { isAdmin, genesisFinalized, refetch } = useProtocolAuthority();
  const ensureChain = useEnsureProtocolChain();
  const client = usePublicClient({ chainId: PROTOCOL_CHAIN.id });
  const { writeContractAsync } = useWriteContract();

  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const finalize = async () => {
    if (!address || !client || !isAdmin || genesisFinalized) return;

    setError(null);
    try {
      await ensureChain();

      const send = async (
        label: string,
        request: Parameters<typeof writeContractAsync>[0],
      ) => {
        setStep(label);
        const txHash = await writeContractAsync(request);
        const receipt = await client.waitForTransactionReceipt({
          hash: txHash,
        });
        if (receipt.status !== 'success') throw new Error(`${label} reverted`);
        return txHash;
      };

      const count = await client.readContract({
        address: ADDRESSES.BONDING,
        abi: BONDING_ABI,
        functionName: 'nextSeriesId',
      });
      if (Number(count) > 0) {
        const id = Number(count) - 1;
        const read = () =>
          client.readContract({
            address: ADDRESSES.BONDING,
            abi: BONDING_ABI,
            functionName: 'getSeries',
            args: [id],
          }) as Promise<Series>;
        const s = await read();
        if (s.capacityMstrat > s.filledMstrat) {
          await send(
            `Cutting series ${id} to what sold`,
            authorityCall(ADDRESSES.BONDING, BONDING_ABI, 'retuneSeries', [
              id,
              s.filledMstrat,
              s.vestingTerm,
              s.endTime,
            ]),
          );
        }
        if ((await read()).isActive) {
          await send(
            `Closing series ${id}`,
            authorityCall(ADDRESSES.BONDING, BONDING_ABI, 'setSeriesActive', [
              id,
              false,
            ]),
          );
        }
      }

      for (const call of DAO_RESERVED_CALLS) {
        const restricted = await client.readContract({
          address: ADDRESSES.AUTHORITY,
          abi: AUTHORITY_ABI,
          functionName: 'restricted',
          args: [call.target, call.selector],
        });
        if (restricted) continue;
        await send(`Reserving ${call.label} for the upgrade track`, {
          chainId: PROTOCOL_CHAIN.id,
          address: ADDRESSES.AUTHORITY,
          abi: AUTHORITY_ABI,
          functionName: 'restrict',
          args: [call.target, call.selector],
        });
      }

      const txHash = await send('Finalizing Genesis', {
        chainId: PROTOCOL_CHAIN.id,
        address: ADDRESSES.AUTHORITY,
        abi: AUTHORITY_ABI,
        functionName: 'finalizeGenesis',
        args: [],
      });
      setHash(txHash);
      setIsSuccess(true);
      notifyTransaction.success(
        'write',
        txHash,
        'Genesis finalized — the protocol now belongs to the DAO',
      );
      refetch?.()?.catch(() => undefined);
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Transaction failed');
      setError(e);
      notifyTransaction.error('write', e);
    } finally {
      setStep(null);
    }
  };

  return {
    finalize,
    hash,
    /** What the current transaction does; null when idle. */
    step,
    isPending: step !== null,
    isConfirming: false,
    isSuccess,
    error,
    canFinalize: isAdmin && !genesisFinalized,
    genesisFinalized,
  };
};
