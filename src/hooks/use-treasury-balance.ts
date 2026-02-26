import { useProtocolDashboard } from './use-protocol-dashboard';

export const useTreasuryBalance = () => {
  const {
    treasuryBtc,
    treasuryBtcRaw,
    treasuryUsd,
    btcPriceUsd,
    isLoading,
    error,
    refetch,
  } = useProtocolDashboard();

  return {
    btc: treasuryBtc,
    btcRaw: treasuryBtcRaw,
    usd: treasuryUsd,
    btcPriceUsd,
    isLoading,
    error,
    refetch,
  };
};
