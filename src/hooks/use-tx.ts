import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useWaitForTransactionReceipt,
  useWriteContract,
  type UseWriteContractReturnType,
} from 'wagmi';

import { useEnsureProtocolChain } from './use-ensure-chain';

import { describeError, type DescribedError } from '../lib/errors';
import { refreshAfterWrite } from '../lib/invalidate';
import { notifyTransaction, type TransactionType } from '../lib/notifications';

type WriteRequest = Parameters<
  UseWriteContractReturnType['writeContractAsync']
>[0];

/**
 * Switch chain, sign, wait for the receipt, notify once, refresh reads.
 * Never throws; failures are described in words. Reads refresh on the receipt, not the hash.
 */
export const useTx = (kind: TransactionType) => {
  const ensureChain = useEnsureProtocolChain();
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();

  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash, query: { enabled: !!hash } });

  const announced = useRef<string | null>(null);

  useEffect(() => {
    if (!isConfirmed || !hash || announced.current === hash) return;
    announced.current = hash;
    notifyTransaction.success(kind, hash, successMessage ?? 'Confirmed');
    void refreshAfterWrite(queryClient);
  }, [isConfirmed, hash, kind, successMessage, queryClient]);

  // A reverted receipt is a failure the send path never sees.
  const failed = error ?? receiptError ?? null;
  const settled = isConfirmed || failed !== null;
  const inFlight = settled ? null : pending;
  const described: DescribedError | null = failed
    ? describeError(failed)
    : null;

  // A dismissed prompt is not shown as an error.
  const displayed = described?.kind === 'rejected' ? null : described;

  const notifiedFailure = useRef<unknown>(null);
  useEffect(() => {
    if (!failed || notifiedFailure.current === failed) return;
    notifiedFailure.current = failed;
    notifyTransaction.error(kind, failed, hash);
  }, [failed, kind, hash]);

  /** Resolves to the hash, or undefined on any refusal. Never throws. */
  const send = useCallback(
    async (
      label: string,
      message: string,
      request: WriteRequest,
    ): Promise<`0x${string}` | undefined> => {
      setError(null);
      setHash(undefined);
      setPending(label);
      setSuccessMessage(message);

      try {
        await ensureChain();
        const sent = await writeContractAsync(request);
        setHash(sent);
        return sent;
      } catch (caught) {
        setError(caught);
        setPending(null);
        return undefined;
      }
    },
    [ensureChain, writeContractAsync],
  );

  return {
    send,

    /** Label of the call in flight; null when idle. */
    pending: inFlight,
    isBusy: !settled && (pending !== null || isConfirming),
    /** A dismissed prompt is not an error. */
    error: displayed,
    hash,
  };
};
