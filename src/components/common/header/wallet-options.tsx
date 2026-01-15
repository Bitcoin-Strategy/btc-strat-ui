import { useEffect, useState } from 'react';
import type { Connector } from 'wagmi';
import { useConnect, useConnectors } from 'wagmi';

import { notifyWallet } from '../../../lib/notifications';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui';

export function WalletOptions() {
  const connectors = useConnectors();
  const { mutate: connect, error, isPending, isSuccess, data } = useConnect();

  useEffect(() => {
    if (isSuccess && data?.accounts?.[0]) {
      const account =
        typeof data.accounts[0] === 'string'
          ? data.accounts[0]
          : data.accounts[0].address;
      notifyWallet.connected(account);
    }
  }, [isSuccess, data]);

  useEffect(() => {
    if (error) {
      notifyWallet.error(error);
    }
  }, [error]);

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Connect Wallet</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              Choose a wallet to connect to Bitcoin Strategy.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2">
            {connectors.map((connector) => (
              <WalletOption
                key={connector.uid}
                connector={connector}
                isPending={isPending}
                onClick={() => connect({ connector })}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WalletOption({
  connector,
  isPending,
  onClick,
}: {
  connector: Connector;
  isPending: boolean;
  onClick: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    connector.getProvider().then(
      (provider) => {
        if (active) setReady(!!provider);
      },
      (error: unknown) => {
        if (!active) return;
        setUnavailable(true);
        notifyWallet.error(error);
      },
    );
    return () => {
      active = false;
    };
  }, [connector]);

  return (
    <Button disabled={!ready || isPending} onClick={onClick}>
      {connector.name}
      {unavailable && ' — unavailable'}
    </Button>
  );
}
