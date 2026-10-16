import { Menu } from 'lucide-react';
import { useConnection } from 'wagmi';

import { Account } from './account';
import { NotificationBell } from './notifications';
import { WalletOptions } from './wallet-options';

import { useProtocolDashboard } from '../../../hooks/use-protocol-dashboard';
import { smartFormatter } from '../../../lib';
import { SocialLinks } from '../social-links';

/** Below `sm` only the BTC price is shown. */
export function Header({ onMenu }: { onMenu: () => void }) {
  const { isConnected } = useConnection();
  const {
    btcPriceUsd,
    navUsdPerStrat,
    marketUsdPerStrat,
    premiumPct,
    oracleReady,
  } = useProtocolDashboard();
  return (
    <header className="border-border bg-card/80 sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={onMenu}
        aria-label="Open the menu"
        className="text-muted shrink-0 hover:text-white lg:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="flex min-w-0 items-center gap-3 text-sm sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-muted hidden sm:inline">BTC Price:</span>
          <span className="text-muted sm:hidden">BTC</span>
          <span className="text-orange font-mono font-medium">
            ${smartFormatter(btcPriceUsd)}
          </span>
        </div>
        <div className="bg-border hidden h-4 w-px sm:block"></div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-muted">$STRAT Price:</span>
          <span className="font-mono font-medium text-white">
            {oracleReady ? `$${smartFormatter(marketUsdPerStrat)}` : '—'}
          </span>
        </div>
        <div className="bg-border hidden h-4 w-px md:block"></div>
        <div className="hidden items-center gap-2 md:flex">
          <span className="text-muted">NAV (USD):</span>
          <span className="text-green font-mono font-medium">
            ${smartFormatter(navUsdPerStrat)}
          </span>
          {premiumPct !== null && (
            <span
              className={`text-xs font-medium ${premiumPct >= 0 ? 'text-green' : 'text-red'}`}
            >
              ({premiumPct >= 0 ? '+' : ''}
              {smartFormatter(premiumPct as number)}%)
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <SocialLinks className="hidden md:flex" />

        {isConnected ? (
          <>
            <NotificationBell />
            <Account />
          </>
        ) : (
          <WalletOptions />
        )}
      </div>
    </header>
  );
}
