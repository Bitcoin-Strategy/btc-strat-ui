import { TREASURY_ABI } from '../../../lib/abi/treasury';
import { ADDRESSES } from '../../../lib/addresses';
import { AdminSettingCard } from '../admin-setting-card';
import { ContractSection } from '../contract-section';

interface TreasurySectionProps {
  isAdminMode: boolean;
  isCorrectNetwork: boolean;
}

/** Outflow ceilings are immutable per deployment, so they are read rather than hardcoded. */
export function TreasurySection({
  isAdminMode,
  isCorrectNetwork,
}: TreasurySectionProps) {
  return (
    <ContractSection
      title="Treasury"
      description="How fast value may leave. Lower is stricter; the ceiling on each cannot be raised."
    >
      {/* A continuously refilling bucket, not a resetting window. */}
      <AdminSettingCard
        config={{
          label: 'BTC outflow rate',
          description:
            'Share of the bitcoin balance that may leave per week. Only redemption draws bitcoin.',
          inputType: 'bps',
          unit: '%',
          placeholder: '0.05',
          bound: { fn: 'MAX_BTC_OUTFLOW_BPS', kind: 'max' },
        }}
        contractAddress={ADDRESSES.TREASURY}
        abi={TREASURY_ABI}
        readFunctionName="btcOutflowBps"
        writeFunctionName="setBtcOutflowBps"
        readTransform={(value) => `${Number(value) / 100}% a week`}
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />

      <AdminSettingCard
        config={{
          label: 'STRAT outflow rate',
          description:
            'Share of the STRAT balance that may leave per week. Only vesting claims draw STRAT.',
          inputType: 'bps',
          unit: '%',
          placeholder: '10',
          bound: { fn: 'MAX_STRAT_OUTFLOW_BPS', kind: 'max' },
        }}
        contractAddress={ADDRESSES.TREASURY}
        abi={TREASURY_ABI}
        readFunctionName="stratOutflowBps"
        writeFunctionName="setStratOutflowBps"
        readTransform={(value) => `${Number(value) / 100}% a week`}
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />
    </ContractSection>
  );
}
