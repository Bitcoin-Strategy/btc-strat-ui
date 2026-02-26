import { useReadContract } from 'wagmi';

import { useBtcUsd } from './use-btc-usd';

import { PROTOCOL_ORACLE_ABI } from '../lib/abi/protocol-oracle';
import { TREASURY_ABI } from '../lib/abi/treasury';
import { ADDRESSES } from '../lib/addresses';
import { PROTOCOL_CHAIN } from '../lib/chains';
import { btcToUsd, premiumBps, wadToNumber } from '../lib/units';

/** NAV from the Treasury, market from `ProtocolOracle`, premium as `PremiumSales` computes it. */
export const useProtocolPrices = () => {
  const { btcUsd, isStale: btcUsdStale } = useBtcUsd();

  const {
    data: navWad,
    isLoading: navLoading,
    error: navError,
  } = useReadContract({
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.TREASURY,
    abi: TREASURY_ABI,
    functionName: 'navBtcPerStrat',
  });

  // The oracle reverts until the pool has liquidity and a full TWAP window.
  const {
    data: marketWad,
    isLoading: marketLoading,
    error: marketError,
  } = useReadContract({
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.PROTOCOL_ORACLE,
    abi: PROTOCOL_ORACLE_ABI,
    functionName: 'getPriceWad',
    args: [ADDRESSES.STRAT, ADDRESSES.BTC],
    query: { retry: false },
  });

  const nav = navWad as bigint | undefined;
  const market = marketWad as bigint | undefined;

  // `undefined` means not read; zero is a real NAV at launch.
  const navBtc = nav === undefined ? null : wadToNumber(nav);
  const marketBtc = market === undefined ? null : wadToNumber(market);

  return {
    // WAD.
    navWad: nav ?? null,
    marketWad: market ?? null,

    navBtc,
    marketBtc,

    navUsd: navBtc === null ? null : btcToUsd(navBtc, btcUsd),
    marketUsd: marketBtc === null ? null : btcToUsd(marketBtc, btcUsd),

    premiumBps: nav && market ? premiumBps(market, nav) : null,
    mnav: navBtc && marketBtc ? marketBtc / navBtc : null,

    btcUsd,
    btcUsdStale,

    oracleReady: !!market && !marketError,
    oracleError: marketError ?? null,

    isLoading: navLoading || marketLoading,
    error: navError ?? null,
  };
};
