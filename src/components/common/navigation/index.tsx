import {
  Hourglass,
  Landmark,
  LayoutDashboard,
  Link2,
  Settings,
  Vote,
  X,
} from 'lucide-react';
import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useConnection } from 'wagmi';

import { useAdminMode } from '../../../hooks/use-admin-mode';
import { useProtocolChain } from '../../../hooks/use-protocol-chain';
import { PAGE } from '../../../lib/constants';
import { cn } from '../../../lib/utils';
import { SocialLinks } from '../social-links';

const HEADER_ITEMS = [
  { label: 'Dashboard', path: PAGE.DASHBOARD, icon: LayoutDashboard },
  { label: 'Bonding', path: PAGE.BONDING, icon: Link2 },
  { label: 'Vesting', path: PAGE.VESTING, icon: Hourglass },
  { label: 'Redemption', path: PAGE.REDEMPTION, icon: Landmark },
  { label: 'Governance', path: PAGE.GOVERNANCE, icon: Vote },
] satisfies { label: string; path: string; icon: React.ElementType }[];

// Only the admin sees this, and only during Genesis.
const ADMIN_ITEM = {
  label: 'System Parameters',
  path: PAGE.SYSTEM_PARAMETERS,
  icon: Settings,
};

function NetworkStatus() {
  const { isConnected } = useConnection();
  const { wrongChain, targetName } = useProtocolChain();

  const tone = !isConnected
    ? 'bg-muted'
    : wrongChain
      ? 'bg-orange animate-pulse'
      : 'bg-green animate-pulse';

  return (
    <div className="border-border bg-dark rounded-lg border p-3">
      <div className="text-muted mb-1 text-xs">Network</div>
      <div className="flex items-center gap-2">
        <div className={cn('h-2 w-2 shrink-0 rounded-full', tone)} />
        <span className="truncate font-mono text-sm text-white">
          {targetName}
        </span>
      </div>
      {isConnected && wrongChain && (
        <div className="text-orange mt-1 text-xs">Your wallet is elsewhere</div>
      )}
    </div>
  );
}

/** A drawer below `lg`; any navigation closes it. */
export function Navigation({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { isAdminMode } = useAdminMode();
  const items = isAdminMode ? [...HEADER_ITEMS, ADMIN_ITEM] : HEADER_ITEMS;
  const location = useLocation();

  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  return (
    <>
      {open && (
        <button
          aria-label="Close the menu"
          onClick={onClose}
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          'border-border bg-card fixed left-0 top-0 z-30 flex h-dvh w-64 flex-col border-r transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        )}
      >
        <div className="border-border/50 flex items-center gap-3 border-b p-6">
          <div className="bg-orange flex h-8 w-8 shrink-0 items-center justify-center rounded font-bold text-black">
            B
          </div>
          <span className="truncate text-xl font-bold tracking-tight">
            Bitcoin Strategy
          </span>
          <button
            onClick={onClose}
            aria-label="Close the menu"
            className="text-muted ml-auto hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          <div className="text-muted mb-3 px-3 text-xs font-semibold uppercase">
            Protocol
          </div>
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200',
                  isActive
                    ? 'border-orange/20 bg-orange/10 text-orange border'
                    : 'text-muted hover:bg-border/30 hover:text-white',
                )
              }
            >
              <item.icon size={20} className="shrink-0" />
              <span className="truncate font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-border/50 space-y-3 border-t p-4">
          <SocialLinks variant="panel" />
          <NetworkStatus />
        </div>
      </aside>
    </>
  );
}
