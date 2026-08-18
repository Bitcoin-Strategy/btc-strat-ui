import { useProtocolAuthority } from './use-protocol-authority';

/** UI-only flag; every admin write is `onlyOwner` on chain. */
export const useAdminMode = () => {
  const { isAdmin, isGuardian, admin, genesisFinalized, isLoading } =
    useProtocolAuthority();

  return {
    isAdminMode: isAdmin,
    isGuardian,
    admin,
    genesisFinalized,
    isLoading,
  };
};
