import { useReadContract } from 'wagmi';

import { STAKING_ABI } from '../../../lib/abi/staking';
import { TREASURY_ABI } from '../../../lib/abi/treasury';
import { ADDRESSES } from '../../../lib/addresses';
import { PROTOCOL_CHAIN } from '../../../lib/chains';
import { AdminMultiInputCard } from '../admin-multi-input-card';
import { ContractSection } from '../contract-section';

interface StakingSectionProps {
  isAdminMode: boolean;
  isCorrectNetwork: boolean;
}

const WAD = 10n ** 18n;

/** 18-decimal fixed point. */
const toWad = (value: string) => {
  const [whole, fraction = ''] = value.trim().split('.');
  const padded = `${fraction}${'0'.repeat(18)}`.slice(0, 18);
  return BigInt(`${whole || '0'}${padded}`);
};

const fromWad = (value: any) => {
  const scaled = (BigInt(value) * 10_000n) / WAD;
  return `${Number(scaled) / 10_000}x`;
};

const asDuration = (value: any) => {
  const seconds = Number(value);
  return seconds < 86_400
    ? `${(seconds / 3_600).toFixed(1)} hours`
    : `${(seconds / 86_400).toFixed(1)} days`;
};

/** The Treasury clips payouts to `MAX_REDEMPTION_PAYOUT_BPS` of NAV, so a higher max has no effect. */
export function StakingSection({
  isAdminMode,
  isCorrectNetwork,
}: StakingSectionProps) {
  const { data: payoutBps } = useReadContract({
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.TREASURY,
    abi: TREASURY_ABI,
    functionName: 'MAX_REDEMPTION_PAYOUT_BPS',
  });

  const effectiveMax =
    payoutBps === undefined ? undefined : Number(payoutBps) / 10_000;
  const ceilingNote =
    effectiveMax === undefined
      ? ''
      : ` Anything above ${effectiveMax} behaves as ${effectiveMax}, because the Treasury clips every payout there.`;

  return (
    <ContractSection
      title="Staking"
      description="What a redemption pays, by how long the stake was held"
    >
      <AdminMultiInputCard
        title="Time held factor"
        description={`A multiplier on the backing of the STRAT being redeemed. It starts at the minimum the moment a stake is made and climbs to the maximum over the ramp.${ceilingNote}`}
        requireAllFields={true}
        validate={(values) => {
          const errors: Record<string, string> = {};
          const min = parseFloat(values.thfMin);
          const max = parseFloat(values.thfMax);
          const ramp = parseFloat(values.thfMaxTime);

          if (min === 0) errors.thfMin = 'Must be above 0';
          if (min > 1) errors.thfMin = 'Cannot be above 1.0';
          if (max > 1) errors.thfMax = 'Cannot be above 1.0';
          if (!Number.isNaN(min) && !Number.isNaN(max) && max < min) {
            errors.thfMax = `Cannot be below the minimum of ${min}`;
          }
          if (ramp === 0) errors.thfMaxTime = 'Must be above 0';

          // Not a revert: the contract accepts it and nothing changes.
          if (effectiveMax !== undefined) {
            if (!errors.thfMax && max > effectiveMax) {
              errors.thfMax = `Nothing above ${effectiveMax} has any effect: the Treasury clips every payout there. Use ${effectiveMax}.`;
            }
            if (!errors.thfMin && min > effectiveMax) {
              errors.thfMin = `Nothing above ${effectiveMax} has any effect: the Treasury clips every payout there.`;
            }
          }

          return Object.keys(errors).length > 0 ? errors : null;
        }}
        fields={[
          {
            name: 'thfMin',
            label: 'Minimum',
            description:
              'What a stake made a moment ago is worth on redemption',
            inputType: 'uint',
            unit: 'x',
            readFunctionName: 'thfMin',
            readTransform: fromWad,
            writeTransform: toWad,
            placeholder: '0.2',
          },
          {
            name: 'thfMax',
            label: 'Maximum',
            description:
              effectiveMax === undefined
                ? 'What a stake held for the whole ramp is worth'
                : `What a stake held for the whole ramp is worth. ${effectiveMax} is as high as this can go and still mean anything.`,
            inputType: 'uint',
            unit: 'x',
            readFunctionName: 'thfMax',
            readTransform: fromWad,
            writeTransform: toWad,
            placeholder:
              effectiveMax === undefined ? '0.95' : String(effectiveMax),
          },
          {
            name: 'thfMaxTime',
            label: 'Ramp',
            description: 'How long a stake takes to reach the maximum',
            inputType: 'uint',
            unit: 'days',
            readFunctionName: 'thfMaxTime',
            readTransform: asDuration,
            writeTransform: (value) =>
              BigInt(Math.floor(parseFloat(value) * 86_400)),
            placeholder: '365',
          },
        ]}
        contractAddress={ADDRESSES.STAKING}
        abi={STAKING_ABI}
        writeFunctionName="setThfParams"
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />
    </ContractSection>
  );
}
