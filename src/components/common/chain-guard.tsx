import { AlertTriangle, Loader2 } from 'lucide-react';

import { useProtocolChain } from '../../hooks/use-protocol-chain';

/** Shown when the wallet refused to switch to the configured chain. */
export function ChainGuard() {
  const { wrongChain, isSwitching, declined, switchToProtocol, targetName } =
    useProtocolChain();

  if (!wrongChain) return null;

  return (
    <div className="border-orange/20 bg-orange/10 mx-4 mt-4 flex flex-col gap-3 rounded-lg border px-4 py-3 sm:mx-6 sm:flex-row sm:items-center lg:mx-8">
      <AlertTriangle size={20} className="text-orange shrink-0" />
      <div className="flex-1">
        <div className="text-orange font-semibold">
          Your wallet is on another network
        </div>
        <div className="text-orange/80 text-sm">
          {isSwitching
            ? `Waiting for the wallet to switch to ${targetName}…`
            : `Everything here lives on ${targetName}. Nothing will sign until the wallet is on it.`}
        </div>
      </div>
      <button
        onClick={switchToProtocol}
        disabled={isSwitching}
        className="bg-orange hover:bg-orange/80 flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
      >
        {isSwitching && <Loader2 size={14} className="animate-spin" />}
        Switch to {targetName}
      </button>
      {declined && <span className="sr-only">{declined.message}</span>}
    </div>
  );
}
