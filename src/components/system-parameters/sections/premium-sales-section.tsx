import { formatUnits, parseUnits } from 'viem';

import { PREMIUM_SALES_ABI } from '../../../lib/abi/premium-sales';
import { ADDRESSES } from '../../../lib/addresses';
import { AdminBandsCard } from '../admin-bands-card';
import { AdminExecutionCard } from '../admin-execution-card';
import { AdminMultiInputCard } from '../admin-multi-input-card';
import { AdminSettingCard } from '../admin-setting-card';
import { ContractSection } from '../contract-section';

interface PremiumSalesSectionProps {
  isAdminMode: boolean;
  isCorrectNetwork: boolean;
}

const HOUR = 3_600;

const asDuration = (seconds: any) => {
  const value = Number(seconds);
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? '' : 's'}`;
  if (value % 86_400 === 0 && value >= 86_400) {
    return plural(value / 86_400, 'day');
  }
  const hours = value / HOUR;
  return value % HOUR === 0
    ? plural(hours, 'hour')
    : `${hours.toFixed(1)} hours`;
};

/** Running a sale is permissionless and lives on the dashboard. */
export function PremiumSalesSection({
  isAdminMode,
  isCorrectNetwork,
}: PremiumSalesSectionProps) {
  return (
    <ContractSection
      title="Premium sales"
      description="Selling part of the STRAT reserve while the market is above backing"
    >
      <AdminBandsCard
        contractAddress={ADDRESSES.PREMIUM_SALES}
        abi={PREMIUM_SALES_ABI}
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />

      <AdminSettingCard
        config={{
          label: 'Window length',
          description:
            'How long a selling window lasts. Each band allows its share once per window.',
          inputType: 'uint',
          unit: 'hours',
          placeholder: '24',
          bound: { fn: 'MIN_WINDOW_LENGTH', kind: 'min' },
        }}
        contractAddress={ADDRESSES.PREMIUM_SALES}
        abi={PREMIUM_SALES_ABI}
        readFunctionName="windowLength"
        writeFunctionName="setWindowLength"
        readTransform={asDuration}
        writeTransform={(value) => BigInt(Math.floor(parseFloat(value) * HOUR))}
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />

      {/* The contract caps both to the sale surplus over NAV. */}
      <AdminMultiInputCard
        title="What the caller earns"
        description="A sale is permissionless, so somebody has to be paid to run it. Both of these are cut down to the sale's surplus over NAV, so neither can reach the backing."
        requireAllFields={true}
        fields={[
          {
            name: 'rewardBps',
            label: 'Share of the sale',
            description: 'Taken from the bitcoin the sale brings in',
            inputType: 'bps',
            unit: '%',
            readFunctionName: 'saleRewardBps',
            bound: { fn: 'MAX_SALE_REWARD_BPS', kind: 'max' },
            placeholder: '0.25',
          },
          {
            name: 'maxRewardBtc',
            label: 'Ceiling per sale',
            description:
              'Most one sale may pay its caller. 0 means no ceiling.',
            inputType: 'uint',
            unit: 'BTC',
            readFunctionName: 'maxRewardBtc',
            readTransform: (value) =>
              BigInt(value) === 0n
                ? 'no ceiling'
                : `${formatUnits(BigInt(value), 8)} BTC`,
            writeTransform: (value) => parseUnits(value, 8),
            placeholder: '0',
          },
        ]}
        contractAddress={ADDRESSES.PREMIUM_SALES}
        abi={PREMIUM_SALES_ABI}
        writeFunctionName="setSaleReward"
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />

      <AdminSettingCard
        config={{
          label: 'Sale slippage',
          description:
            'How far under the oracle price a sale may clear. The NAV floor applies on top of this and cannot be relaxed.',
          inputType: 'bps',
          unit: '%',
          placeholder: '1',
          bound: { fn: 'MAX_SALE_SLIPPAGE_BPS', kind: 'max' },
        }}
        contractAddress={ADDRESSES.PREMIUM_SALES}
        abi={PREMIUM_SALES_ABI}
        readFunctionName="saleSlippageBps"
        writeFunctionName="setSaleSlippageBps"
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />

      <AdminSettingCard
        config={{
          label: 'Swap executor',
          description: 'Routes the sale into the pool',
          inputType: 'address',
        }}
        contractAddress={ADDRESSES.PREMIUM_SALES}
        abi={PREMIUM_SALES_ABI}
        readFunctionName="swapExecutor"
        writeFunctionName="setSwapExecutor"
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />

      <AdminExecutionCard
        title="Roll the window forward"
        description="Sales do this themselves. It is here for looking at a fresh window without making a sale to get one."
        actionLabel="Sync the window"
        requireAllFields={false}
        fields={[]}
        contractAddress={ADDRESSES.PREMIUM_SALES}
        abi={PREMIUM_SALES_ABI}
        writeFunctionName="syncWindow"
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />
    </ContractSection>
  );
}
