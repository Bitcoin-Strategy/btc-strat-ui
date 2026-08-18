import { formatUnits, parseUnits } from 'viem';
import { useReadContract } from 'wagmi';

import { REDEMPTION_ABI } from '../../../lib/abi/redemption';
import { TREASURY_ABI } from '../../../lib/abi/treasury';
import { ADDRESSES } from '../../../lib/addresses';
import { PROTOCOL_CHAIN } from '../../../lib/chains';
import { REFRESH, STALE } from '../../../lib/refresh';
import { AdminMultiInputCard } from '../admin-multi-input-card';
import { ContractSection } from '../contract-section';

interface RedemptionSectionProps {
  isAdminMode: boolean;
  isCorrectNetwork: boolean;
}

const DAY = 86_400;
const OUTFLOW_WINDOW_DAYS = 7;

/** The capacity ceiling grows with sold supply, so it is read live and scaled to the epoch length. */
export function RedemptionSection({
  isAdminMode,
  isCorrectNetwork,
}: RedemptionSectionProps) {
  const { data: treasuryCap } = useReadContract({
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.TREASURY,
    abi: TREASURY_ABI,
    functionName: 'redeemCapacity',
    query: { refetchInterval: REFRESH.slow, staleTime: STALE.slow },
  });

  const ceiling = treasuryCap as bigint | undefined;

  return (
    <ContractSection
      title="Redemption"
      description="Off until an epoch capacity is set. The Treasury refuses to settle anything before its own lock-up ends, whatever is set here."
    >
      <AdminMultiInputCard
        title="Epoch configuration"
        description="Each epoch has a capacity in STRAT, and the payout falls along a curve as that capacity fills. A capacity of 0 switches redemption off."
        requireAllFields={true}
        validate={(values) => {
          const days = parseFloat(values.epochDuration);
          const rcap = parseFloat(values.epochRcap);
          const errors: Record<string, string> = {};

          if (!Number.isNaN(days) && days < 1) {
            errors.epochDuration = 'The contract requires at least 1 day';
          }

          // The Treasury caps a rate, so a short epoch cannot multiply it.
          if (
            ceiling !== undefined &&
            !Number.isNaN(days) &&
            days >= 1 &&
            !Number.isNaN(rcap) &&
            rcap > 0
          ) {
            const perWindow =
              (parseUnits(values.epochRcap, 18) *
                BigInt(OUTFLOW_WINDOW_DAYS * DAY)) /
              BigInt(Math.floor(days * DAY));
            if (perWindow > ceiling) {
              const allowed =
                (ceiling * BigInt(Math.floor(days * DAY))) /
                BigInt(OUTFLOW_WINDOW_DAYS * DAY);
              errors.epochRcap = `Over the Treasury cap: at this epoch length it allows ${Number(
                formatUnits(allowed, 18),
              ).toLocaleString()} STRAT`;
            }
          }

          return Object.keys(errors).length > 0 ? errors : null;
        }}
        fields={[
          {
            name: 'epochDuration',
            label: 'Epoch length',
            description:
              'How long a capacity lasts before it refills. Changing it re-anchors the epoch in progress.',
            inputType: 'uint',
            unit: 'days',
            readFunctionName: 'epochDuration',
            readTransform: (value) =>
              `${(Number(value) / DAY).toFixed(1)} days`,
            writeTransform: (value) =>
              BigInt(Math.floor(parseFloat(value) * DAY)),
            bound: { fn: 'MIN_EPOCH_DURATION', kind: 'min' },
            placeholder: '7',
          },
          {
            name: 'epochRcap',
            label: 'Capacity per epoch',
            description:
              ceiling === undefined
                ? 'Most STRAT redeemable in one epoch. 0 switches redemption off.'
                : `Most STRAT redeemable in one epoch. 0 switches redemption off. The Treasury allows ${Number(
                    formatUnits(ceiling, 18),
                  ).toLocaleString()} STRAT a week right now, and that grows as more STRAT is sold.`,
            inputType: 'uint',
            unit: 'STRAT',
            readFunctionName: 'epochRcap',
            readTransform: (value) =>
              BigInt(value) === 0n
                ? 'off'
                : `${Number(formatUnits(BigInt(value), 18)).toLocaleString()} STRAT`,
            writeTransform: (value) => parseUnits(value, 18),
            placeholder: '0',
          },
        ]}
        contractAddress={ADDRESSES.REDEMPTION}
        abi={REDEMPTION_ABI}
        writeFunctionName="setEpochConfig"
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />
    </ContractSection>
  );
}
