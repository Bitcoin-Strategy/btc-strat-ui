import Identicon from '@polkadot/react-identicon';
import { LogOut } from 'lucide-react';
import { useConnection, useDisconnect } from 'wagmi';

import { notifyWallet } from '../../../lib/notifications';
import { Button } from '../../ui';
import { EthAddress } from '../navigation/eth-address';

export function Account() {
  const { address } = useConnection();
  const { disconnect } = useDisconnect();

  const handleDisconnect = () => {
    disconnect();
    notifyWallet.disconnected();
  };

  return (
    <div className="flex items-center gap-2">
      <Identicon
        value={address!}
        size={32}
        theme="ethereum"
        className="identicon hidden size-[32px] overflow-hidden rounded-full sm:block"
      />
      <EthAddress address={address} />
      <Button
        variant="destructive"
        onClick={handleDisconnect}
        aria-label="Disconnect wallet"
      >
        <LogOut />
      </Button>
    </div>
  );
}
