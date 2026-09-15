import { ExternalLink, Megaphone, X } from 'lucide-react';
import { useState } from 'react';

import { useMarketPhase } from '../../hooks/use-market-phase';
import { LINKS } from '../../lib/constants';

const STORAGE_KEY = 'mstrx.cca-notice-dismissed';

const readDismissed = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const writeDismissed = () => {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Storage unavailable; not worth failing over.
  }
};

/** Explains why the protocol looks idle before the auction. No dates or amounts until they are announced. */
export function CcaBanner() {
  const { poolOpen } = useMarketPhase();
  const [dismissed, setDismissed] = useState(readDismissed);

  // Wait for the first read, so the notice never flashes.
  if (poolOpen !== false || dismissed) return null;

  return (
    <div className="border-orange/20 bg-orange/5 relative mx-4 mt-4 flex flex-col gap-3 rounded-lg border px-4 py-3 sm:mx-6 sm:flex-row sm:items-center lg:mx-8">
      <Megaphone size={20} className="text-orange shrink-0" />

      <div className="flex-1 pr-6 sm:pr-0">
        <div className="text-orange font-semibold">
          Genesis auction on the way
        </div>
        <div className="text-muted text-sm">
          STRAT has not been distributed yet. It goes out first in a Continuous
          Clearing Auction on Uniswap, which is also what opens the STRAT/cbBTC
          market — so the figures here are not a live market yet.
        </div>
      </div>

      <a
        href={LINKS.SITE}
        target="_blank"
        rel="noreferrer"
        className="text-orange hover:text-orange/80 flex shrink-0 items-center gap-1 text-sm font-semibold transition-colors"
      >
        Learn more
        <ExternalLink size={12} />
      </a>

      <button
        type="button"
        onClick={() => {
          writeDismissed();
          setDismissed(true);
        }}
        aria-label="Dismiss"
        className="text-muted absolute right-3 top-3 transition-colors hover:text-white sm:static"
      >
        <X size={16} />
      </button>
    </div>
  );
}
