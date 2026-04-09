import { ExternalLink } from 'lucide-react';
import { formatUnits } from 'viem';

import { explorerTx } from '../../lib/addresses';
import type { PendingBondSwap } from '../../lib/swap';
import { smartFormatter } from '../../lib/utils';

/** The swap landed but the bond did not. */
export function PendingSwapBanner({
  pending,
  amountRaw,
  btcDecimals,
  btcSymbol,
  shortfall,
  onDiscard,
}: {
  pending: PendingBondSwap;
  // The swap output, or the wallet balance if it has dropped since.
  amountRaw: bigint | undefined;
  btcDecimals: number;
  btcSymbol: string;
  shortfall: boolean;
  onDiscard: () => void;
}) {
  const swapped = Number(formatUnits(BigInt(pending.amountRaw), btcDecimals));
  const bondable =
    amountRaw === undefined ? 0 : Number(formatUnits(amountRaw, btcDecimals));

  return (
    <div className="border-orange/40 bg-orange/10 space-y-2 rounded-xl border p-4">
      <div className="text-sm font-bold text-orange-200">Finish your bond</div>
      <p className="text-xs text-orange-100/90">
        Swap done:{' '}
        <span className="font-mono">
          {smartFormatter(swapped, 8)} {btcSymbol}
        </span>{' '}
        in your wallet. One transaction left.
      </p>

      {shortfall && (
        <p className="text-xs text-orange-100/90">
          Your balance is lower now, so this bonds the{' '}
          <span className="font-mono">
            {smartFormatter(bondable, 8)} {btcSymbol}
          </span>{' '}
          you still hold.
        </p>
      )}

      <div className="flex items-center gap-3 text-[11px]">
        <a
          href={explorerTx(pending.swapHash)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-orange-200 hover:text-white"
        >
          View swap <ExternalLink size={10} />
        </a>
        <button
          type="button"
          onClick={onDiscard}
          className="text-orange-200/70 hover:text-white"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
