import { useState } from 'react';
import {
  useConnection,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { useEnsureProtocolChain } from './use-ensure-chain';
import { useProtocolAuthority } from './use-protocol-authority';

import { AUTHORITY_ABI } from '../lib/abi/authority';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';
import { notifyTransaction } from '../lib/notifications';

/** Calls the authority directly; irreversible. */
export const useFinalizeGenesis = () => {
  const { address } = useConnection();
  const { isAdmin, genesisFinalized, refetch } = useProtocolAuthority();
  const ensureChain = useEnsureProtocolChain();

  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const { writeContractAsync } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  const finalize = async () => {
    if (!address || !isAdmin || genesisFinalized) return;

    setError(null);
    setIsPending(true);
    try {
      await ensureChain();
      const txHash = await writeContractAsync({
        chainId: PROTOCOL_CHAIN.id,
        address: ADDRESSES.AUTHORITY,
        abi: AUTHORITY_ABI,
        functionName: 'finalizeGenesis',
        args: [],
      });
      setHash(txHash);
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
      setIsPending(false);
    }
  };

  return {
    finalize,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    canFinalize: isAdmin && !genesisFinalized,
    genesisFinalized,
  };
};
