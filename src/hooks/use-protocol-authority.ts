import { zeroAddress } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';

import { AUTHORITY_ABI } from '../lib/abi/authority';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';
import { PHASE } from '../lib/governance';
import { REFRESH, STALE } from '../lib/refresh';

/** The admin acts directly during Genesis; `finalizeGenesis()` zeroes it. */
export const useProtocolAuthority = () => {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        chainId: PROTOCOL_CHAIN.id,
        address: ADDRESSES.AUTHORITY,
        abi: AUTHORITY_ABI,
        functionName: 'admin',
      },
      {
        chainId: PROTOCOL_CHAIN.id,
        address: ADDRESSES.AUTHORITY,
        abi: AUTHORITY_ABI,
        functionName: 'controller',
      },
      {
        chainId: PROTOCOL_CHAIN.id,
        address: ADDRESSES.AUTHORITY,
        abi: AUTHORITY_ABI,
        functionName: 'guardian',
      },
      {
        chainId: PROTOCOL_CHAIN.id,
        address: ADDRESSES.AUTHORITY,
        abi: AUTHORITY_ABI,
        functionName: 'genesisFinalized',
      },
      {
        chainId: PROTOCOL_CHAIN.id,
        address: ADDRESSES.AUTHORITY,
        abi: AUTHORITY_ABI,
        functionName: 'GUARDIAN_EXPIRY',
      },
      {
        chainId: PROTOCOL_CHAIN.id,
        address: ADDRESSES.AUTHORITY,
        abi: AUTHORITY_ABI,
        functionName: 'GUARDIAN_PERIOD',
      },
    ],
    query: { refetchInterval: REFRESH.slow, staleTime: STALE.slow },
  });

  const admin = (data?.[0]?.result as `0x${string}` | undefined) ?? zeroAddress;
  const controller =
    (data?.[1]?.result as `0x${string}` | undefined) ?? zeroAddress;
  const guardian =
    (data?.[2]?.result as `0x${string}` | undefined) ?? zeroAddress;
  const genesisFinalized = (data?.[3]?.result as boolean | undefined) ?? false;
  const guardianExpiryRaw = (data?.[4]?.result as bigint | undefined) ?? 0n;
  const guardianPeriod = (data?.[5]?.result as bigint | undefined) ?? 0n;

  // Before finalization the authority reports `uint64` max, which is not a date.
  const notStarted = guardianExpiryRaw === 2n ** 64n - 1n;
  const guardianExpiry = notStarted ? null : guardianExpiryRaw;

  const same = (a?: string, b?: string) =>
    !!a && !!b && a.toLowerCase() === b.toLowerCase();

  return {
    admin,
    controller,
    guardian,
    // Unix seconds; null before finalization.
    guardianExpiry,
    guardianPeriod,
    genesisFinalized,
    phase: genesisFinalized ? PHASE.Dao : PHASE.Genesis,

    isAdmin: admin !== zeroAddress && same(address, admin),
    isGuardian: guardian !== zeroAddress && same(address, guardian),

    isLoading,
    error,
    refetch,
  };
};
