import { encodeFunctionData, type Abi } from 'viem';

import { AUTHORITY_ABI } from './abi/authority';
import { ADDRESSES } from './addresses';
import { PROTOCOL_CHAIN } from './chains';

/** Owner calls go through `ProtocolAuthority.execute`. Not for permissionless or restricted calls. */
export const authorityCall = (
  target: `0x${string}`,
  abi: Abi,
  functionName: string,
  args: readonly unknown[],
) => ({
  // Pinned so the wallet switches chain instead of sending elsewhere.
  chainId: PROTOCOL_CHAIN.id,
  address: ADDRESSES.AUTHORITY,
  abi: AUTHORITY_ABI,
  functionName: 'execute' as const,
  args: [
    target,
    encodeFunctionData({ abi, functionName, args: args as never }),
  ] as const,
});
