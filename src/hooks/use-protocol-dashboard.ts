import { useReadContract } from 'wagmi';

import { useProtocolPrices } from './use-protocol-prices';

import { PROTOCOL_READER_ABI } from '../lib/abi/protocol-reader';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';
import { btcToUsd, btcWadToBtc, satToBtc, wadToNumber } from '../lib/units';

export const useProtocolDashboard = () => {
  const { data, isLoading, error, refetch } = useReadContract({
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.PROTOCOL_READER,
    abi: PROTOCOL_READER_ABI,
    functionName: 'getDashboard',
  });

  const prices = useProtocolPrices();

  const dash = data as
    | {
        treasuryBtc: bigint;
        navBtcPerStrat: bigint;
        stratTotalSupply: bigint;
        backingSupply: bigint;
        btcBalance: bigint;
      }
    | undefined;

  // `treasuryBtc` is 18 decimals; `btcBalance` is raw cbBTC.
  const treasuryBtc = dash ? btcWadToBtc(dash.treasuryBtc) : 0;
  const treasuryBtcRaw = dash ? satToBtc(dash.btcBalance) : 0;
  const stratTotalSupply = dash ? wadToNumber(dash.stratTotalSupply) : 0;
  // NAV divides by sold supply only.
  const backingSupply = dash ? wadToNumber(dash.backingSupply) : 0;
  const navBtcPerStrat = dash ? wadToNumber(dash.navBtcPerStrat) : 0;

  return {
    treasuryBtc,
    treasuryBtcRaw,
    stratTotalSupply,
    backingSupply,

    navBtcPerStrat,
    marketBtcPerStrat: prices.marketBtc,

    treasuryUsd: btcToUsd(treasuryBtc, prices.btcUsd),
    navUsdPerStrat: btcToUsd(navBtcPerStrat, prices.btcUsd),
    marketUsdPerStrat: prices.marketUsd,
    btcPriceUsd: prices.btcUsd,

    premiumBps: prices.premiumBps,
    premiumPct: prices.premiumBps === null ? null : prices.premiumBps / 100,
    mnav: prices.mnav,

    oracleReady: prices.oracleReady,

    isLoading: isLoading || prices.isLoading,
    error: error ?? prices.error,
    refetch,
  };
};
