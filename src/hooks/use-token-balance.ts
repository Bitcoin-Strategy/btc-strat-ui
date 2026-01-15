import { formatUnits } from 'viem';
import { useConnection, useReadContract } from 'wagmi';

import { ERC20_ABI } from '../lib/abi/erc20';

type UseTokenBalanceParams = {
  tokenAddress: `0x${string}` | undefined;
  decimals?: number;
  enabled?: boolean;
};

export const useTokenBalance = ({
  tokenAddress,
  decimals = 18,
  enabled = true,
}: UseTokenBalanceParams) => {
  const { address } = useConnection();

  const {
    data: balance,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: enabled && !!tokenAddress && !!address,
    },
  });

  const formattedBalance = balance ? formatUnits(balance, decimals) : '0.00';

  return {
    balance,
    formattedBalance,
    isLoading,
    error,
    refetch,
  };
};
