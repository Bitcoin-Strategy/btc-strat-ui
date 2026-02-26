import { useReadContract } from 'wagmi';

import { useProtocolDashboard } from './use-protocol-dashboard';

import { STAKING_ABI } from '../lib/abi/staking';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';
import { wadToNumber } from '../lib/units';

/** Staked STRAT is reported as STRAT: pricing it at NAV would count the Treasury BTC twice. */
export const useTvl = () => {
  const {
    treasuryBtc,
    treasuryUsd,
    stratTotalSupply,
    backingSupply,
    isLoading,
    error,
  } = useProtocolDashboard();

  const { data: totalStaked } = useReadContract({
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.STAKING,
    abi: STAKING_ABI,
    functionName: 'totalStaked',
  });

  const staked = totalStaked ? wadToNumber(totalStaked as bigint) : 0;

  return {
    treasuryBtc,
    treasuryUsd,

    stakedStrat: staked,
    // Against sold supply, since staked STRAT can only come from it.
    stakedShareOfSupply: backingSupply > 0 ? staked / backingSupply : 0,
    stratTotalSupply,
    backingSupply,

    isLoading,
    error,
  };
};
