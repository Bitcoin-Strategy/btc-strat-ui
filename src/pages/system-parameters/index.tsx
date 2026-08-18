import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAccount } from 'wagmi';

import { HandOverCard } from '../../components/system-parameters/hand-over-card';
import {
  BondingSection,
  PremiumSalesSection,
  RedemptionSection,
  StakingSection,
  TreasurySection,
} from '../../components/system-parameters/sections';
import { useAdminMode } from '../../hooks/use-admin-mode';
import { useProtocolChain } from '../../hooks/use-protocol-chain';
import { PROTOCOL_CHAIN } from '../../lib/chains';

/** Shown only to the current admin; after finalization changes go through governance. */
export function SystemParameters() {
  const { isAdminMode, admin, genesisFinalized, isLoading } = useAdminMode();
  const { isConnected } = useAccount();
  // Connector chain; `useChainId()` returns the configured one.
  const { onProtocolChain: isCorrectNetwork } = useProtocolChain();

  const notice = () => {
    if (isLoading) return null;
    if (genesisFinalized) {
      return {
        tone: 'muted' as const,
        title: 'Genesis is finalized — there is no admin',
        body: 'The admin was revoked for good when the protocol was handed to the DAO. Every parameter on this page is now a governance proposal.',
      };
    }
    if (!isConnected) {
      return {
        tone: 'muted' as const,
        title: 'Connect a wallet',
        body: 'These controls belong to the Genesis admin. Connect the admin wallet to see them.',
      };
    }
    if (!isAdminMode) {
      return {
        tone: 'muted' as const,
        title: 'This wallet is not the admin',
        body: `The protocol names ${admin} as its Genesis admin. Nothing here would land from another address — every write behind it is owner-only on-chain.`,
      };
    }
    return null;
  };

  const blocked = notice();

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
            System Parameters
          </h1>
          <p className="text-muted">
            Owner calls the Genesis admin makes directly, before the DAO exists.
          </p>
        </div>
        {isAdminMode && (
          <div className="border-orange/20 bg-orange/10 text-orange flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
            <ShieldCheck size={16} />
            Admin wallet connected
          </div>
        )}
      </div>

      {blocked && (
        <div className="border-border bg-card text-muted mb-6 flex items-start gap-3 rounded-lg border px-4 py-3">
          <ShieldAlert size={20} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-white">{blocked.title}</div>
            <div className="mt-1 break-all text-sm">{blocked.body}</div>
          </div>
        </div>
      )}

      {isAdminMode && !isCorrectNetwork && (
        <div className="border-orange/20 bg-orange/10 text-orange mb-6 flex items-center gap-3 rounded-lg border px-4 py-3">
          <div>
            <div className="font-semibold">Wrong network</div>
            <div className="text-orange/80 text-sm">
              Switch to {PROTOCOL_CHAIN.name} to read and change parameters.
            </div>
          </div>
        </div>
      )}

      {isAdminMode && (
        <div className="space-y-8">
          <TreasurySection
            isAdminMode={isAdminMode}
            isCorrectNetwork={isCorrectNetwork}
          />
          <BondingSection
            isAdminMode={isAdminMode}
            isCorrectNetwork={isCorrectNetwork}
          />
          <StakingSection
            isAdminMode={isAdminMode}
            isCorrectNetwork={isCorrectNetwork}
          />
          <RedemptionSection
            isAdminMode={isAdminMode}
            isCorrectNetwork={isCorrectNetwork}
          />
          <PremiumSalesSection
            isAdminMode={isAdminMode}
            isCorrectNetwork={isCorrectNetwork}
          />

          <HandOverCard isCorrectNetwork={isCorrectNetwork} />
        </div>
      )}
    </div>
  );
}
