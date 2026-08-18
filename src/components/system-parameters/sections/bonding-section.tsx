import { formatUnits, parseUnits } from 'viem';
import { useReadContract, useReadContracts } from 'wagmi';

import { BONDING_ABI } from '../../../lib/abi/bonding';
import { TREASURY_ABI } from '../../../lib/abi/treasury';
import { VESTING_ABI } from '../../../lib/abi/vesting';
import { ADDRESSES } from '../../../lib/addresses';
import { PROTOCOL_CHAIN } from '../../../lib/chains';
import { AdminMultiInputCard } from '../admin-multi-input-card';
import { AdminSettingCard } from '../admin-setting-card';
import { ContractSection } from '../contract-section';
import { REFRESH, STALE } from '../../../lib/refresh';

interface BondingSectionProps {
  isAdminMode: boolean;
  isCorrectNetwork: boolean;
}

const DAY = 86_400;
const BPS = 10_000n;

const btc = (wad: bigint) => `${formatUnits(wad, 18)} BTC`;
const strat = (wad: bigint) =>
  `${Number(formatUnits(wad, 18)).toLocaleString()} STRAT`;

const asDateTime = (seconds: any) => {
  const date = new Date(Number(seconds) * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** `setLiquidityPosition` is absent: it is restricted to the upgrade timelock. */
export function BondingSection({
  isAdminMode,
  isCorrectNetwork,
}: BondingSectionProps) {
  const { data } = useReadContracts({
    contracts: [
      {
        chainId: PROTOCOL_CHAIN.id,
        address: ADDRESSES.TREASURY,
        abi: TREASURY_ABI,
        functionName: 'navBtcPerStrat',
      },
      {
        chainId: PROTOCOL_CHAIN.id,
        address: ADDRESSES.BONDING,
        abi: BONDING_ABI,
        functionName: 'treasuryBps',
      },
      {
        chainId: PROTOCOL_CHAIN.id,
        address: ADDRESSES.VESTING,
        abi: VESTING_ABI,
        functionName: 'availableStratBacking',
      },
      {
        chainId: PROTOCOL_CHAIN.id,
        address: ADDRESSES.BONDING,
        abi: BONDING_ABI,
        functionName: 'nextSeriesId',
      },
      {
        chainId: PROTOCOL_CHAIN.id,
        address: ADDRESSES.BONDING,
        abi: BONDING_ABI,
        functionName: 'liveSeries',
      },
    ],
    query: { refetchInterval: REFRESH.slow, staleTime: STALE.slow },
  });

  const at = (i: number) =>
    data?.[i]?.status === 'success' ? (data[i].result as bigint) : undefined;

  const nav = at(0);
  const treasuryBps = at(1);
  const backing = at(2);
  const nextSeriesId =
    data?.[3]?.status === 'success' ? Number(data[3].result) : undefined;
  const liveSeries =
    data?.[4]?.status === 'success'
      ? (data[4].result as readonly [boolean, number])
      : undefined;
  const liveId = liveSeries?.[0] ? liveSeries[1] : undefined;

  // Bounds are known only for the running series; the contract still checks the others.
  const { data: liveData } = useReadContract({
    chainId: PROTOCOL_CHAIN.id,
    address: ADDRESSES.BONDING,
    abi: BONDING_ABI,
    functionName: 'getSeries',
    args: liveId === undefined ? undefined : [liveId],
    query: {
      enabled: liveId !== undefined,
      refetchInterval: REFRESH.slow,
      staleTime: STALE.slow,
    },
  });

  const live = liveData as
    | {
        capacityMstrat: bigint;
        filledMstrat: bigint;
        vestingTerm: bigint;
        startTime: number;
        endTime: number;
      }
    | undefined;

  // The Treasury share of the price must clear NAV.
  const priceFloor =
    nav !== undefined && treasuryBps !== undefined && treasuryBps > 0n
      ? (nav * BPS + treasuryBps - 1n) / treasuryBps
      : undefined;

  const whichSeries = (verb: string) => {
    if (nextSeriesId === undefined) return `Which one to ${verb}`;
    if (nextSeriesId === 0) return 'No series has been created yet';
    const running =
      liveId === undefined ? 'none is live' : `${liveId} is running`;
    if (nextSeriesId === 1) {
      return liveId === undefined
        ? 'Series 0 is the only one.'
        : 'Series 0 is the only one, and it is running.';
    }
    return `Which one to ${verb}. Series 0 to ${nextSeriesId - 1} exist; ${running}.`;
  };

  const retuneNote =
    live === undefined
      ? ''
      : ` Series ${liveId} is set to ${strat(live.capacityMstrat)} over ${(
          Number(live.vestingTerm) / DAY
        ).toFixed(0)} days, closing ${asDateTime(live.endTime)}.`;

  /** `retuneSeries` checks, in contract order, for the running series only. */
  const retuneRules = (values: Record<string, string>) => {
    const errors: Record<string, string> = {};
    const typedId = values.seriesId?.trim();

    if (nextSeriesId !== undefined && typedId) {
      if (Number(typedId) >= nextSeriesId) {
        errors.seriesId =
          nextSeriesId === 0
            ? 'No series exists yet'
            : `No such series: 0 to ${nextSeriesId - 1} exist`;
      }
    }

    const forLive =
      live !== undefined && liveId !== undefined && typedId === String(liveId);
    if (!forLive) return Object.keys(errors).length > 0 ? errors : null;

    if (values.capacityMstrat) {
      try {
        const capacity = parseUnits(values.capacityMstrat, 18);
        if (capacity > live.capacityMstrat) {
          errors.capacityMstrat = `A retune can only lower it: at most the ${strat(live.capacityMstrat)} it is set to now`;
        } else if (capacity < live.filledMstrat) {
          errors.capacityMstrat = `Below the ${strat(live.filledMstrat)} already filled`;
        }
      } catch {
        // The field validator reports malformed input.
      }
    }

    if (values.vestingTerm) {
      const seconds = Math.floor(parseFloat(values.vestingTerm) * DAY);
      if (!Number.isNaN(seconds) && BigInt(seconds) < live.vestingTerm) {
        errors.vestingTerm = `A retune can only lengthen it: at least the ${(
          Number(live.vestingTerm) / DAY
        ).toFixed(0)} days it is set to now`;
      }
    }

    if (values.endTime) {
      const closes = Math.floor(new Date(values.endTime).getTime() / 1000);
      if (!Number.isNaN(closes)) {
        if (closes > Number(live.endTime)) {
          errors.endTime = `A retune can only bring it earlier: at the latest ${asDateTime(live.endTime)}`;
        } else if (closes <= Number(live.startTime)) {
          errors.endTime = `Has to be after the series opened, at ${asDateTime(live.startTime)}`;
        }
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  const seriesRules = (values: Record<string, string>) => {
    const errors: Record<string, string> = {};

    if (priceFloor !== undefined && values.priceBtcPerStrat) {
      try {
        const price = parseUnits(values.priceBtcPerStrat, 18);
        if (price < priceFloor) {
          errors.priceBtcPerStrat = `Below the NAV floor: at least ${btc(priceFloor)} after the routing takes its share`;
        }
      } catch {
        // The field validator reports malformed input.
      }
    }

    if (backing !== undefined && values.capacityMstrat) {
      try {
        const capacity = parseUnits(values.capacityMstrat, 18);
        if (capacity > backing) {
          errors.capacityMstrat = `More than the Treasury has unpromised: at most ${strat(backing)}`;
        }
      } catch {
        // The field validator reports malformed input.
      }
    }

    if (values.startTime && values.endTime) {
      const opens = new Date(values.startTime).getTime();
      const closes = new Date(values.endTime).getTime();
      if (closes <= opens) {
        errors.endTime = 'Has to be after it opens';
      } else if (closes <= Date.now()) {
        errors.endTime = 'Already in the past';
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  return (
    <ContractSection
      title="Bonding"
      description="Bond series, where a bond's bitcoin goes, and the pool settings"
    >
      <AdminMultiInputCard
        title="Open a series"
        description="One series may be live at a time, and its price is fixed for its whole life. The Treasury's share of that price has to stay at or above NAV, so a long series on a rising NAV is a series that should be repriced."
        requireAllFields={true}
        validate={seriesRules}
        fields={[
          {
            name: 'priceBtcPerStrat',
            label: 'Price',
            description:
              priceFloor === undefined
                ? 'What one STRAT costs'
                : `What one STRAT costs. At least ${btc(priceFloor)} right now, which is what clears NAV after the routing.`,
            inputType: 'uint',
            unit: 'BTC',
            writeOnly: true,
            writeTransform: (value) => parseUnits(value, 18),
            preview: (raw) => btc(BigInt(raw)),
            placeholder: '0.0000024',
          },
          {
            name: 'startTime',
            label: 'Opens',
            description: 'Bonding is refused before this',
            inputType: 'datetime',
            writeOnly: true,
          },
          {
            name: 'endTime',
            label: 'Closes',
            description: 'Bonding is refused after this',
            inputType: 'datetime',
            writeOnly: true,
          },
          {
            name: 'vestingTerm',
            label: 'Vesting term',
            description: 'How long a buyer waits for the whole promise',
            inputType: 'uint',
            unit: 'days',
            writeOnly: true,
            writeTransform: (value) =>
              BigInt(Math.floor(parseFloat(value) * DAY)),
            preview: (raw) => `${(Number(raw) / DAY).toFixed(1)} days`,
            bound: { fn: 'MAX_VESTING_TERM', kind: 'max' },
            placeholder: '180',
          },
          {
            name: 'capacityMstrat',
            label: 'Capacity',
            description:
              backing === undefined
                ? 'Total STRAT the series may promise'
                : `Total STRAT the series may promise. At most ${strat(backing)}, which is what the Treasury holds unpromised.`,
            inputType: 'uint',
            unit: 'STRAT',
            writeOnly: true,
            writeTransform: (value) => parseUnits(value, 18),
            preview: (raw) => strat(BigInt(raw)),
            placeholder: '1000000',
          },
          {
            name: 'minPurchaseBtc',
            label: 'Smallest bond',
            description: 'Anything under this is refused',
            inputType: 'uint',
            unit: 'BTC',
            writeOnly: true,
            writeTransform: (value) => parseUnits(value, 8),
            preview: (raw) => `${formatUnits(BigInt(raw), 8)} BTC`,
            placeholder: '0.0001',
          },
        ]}
        contractAddress={ADDRESSES.BONDING}
        abi={BONDING_ABI}
        writeFunctionName="createSeries"
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />

      <AdminMultiInputCard
        title="Retune a live series"
        description={`A retune can only narrow a series: the capacity comes down, the window gets shorter, the vesting term gets longer. None of it may be raised, and the price cannot be touched at all.${retuneNote}`}
        requireAllFields={true}
        validate={retuneRules}
        fields={[
          {
            name: 'seriesId',
            label: 'Series',
            description: whichSeries('retune'),
            inputType: 'uint16',
            writeOnly: true,
            placeholder: liveId === undefined ? '0' : String(liveId),
          },
          {
            name: 'capacityMstrat',
            label: 'Capacity',
            description:
              live === undefined
                ? 'Can only come down, and never below what is already filled'
                : `Can only come down. Between ${strat(live.filledMstrat)} already filled and the ${strat(live.capacityMstrat)} it is set to now.`,
            inputType: 'uint',
            unit: 'STRAT',
            writeOnly: true,
            writeTransform: (value) => parseUnits(value, 18),
            preview: (raw) => strat(BigInt(raw)),
            placeholder:
              live === undefined
                ? '1000000'
                : formatUnits(live.capacityMstrat, 18),
          },
          {
            name: 'vestingTerm',
            label: 'Vesting term',
            description:
              live === undefined
                ? 'Can only get longer'
                : `Can only get longer. At least the ${(Number(live.vestingTerm) / DAY).toFixed(0)} days it is set to now.`,
            inputType: 'uint',
            unit: 'days',
            writeOnly: true,
            writeTransform: (value) =>
              BigInt(Math.floor(parseFloat(value) * DAY)),
            preview: (raw) => `${(Number(raw) / DAY).toFixed(1)} days`,
            bound: { fn: 'MAX_VESTING_TERM', kind: 'max' },
            placeholder:
              live === undefined
                ? '180'
                : String(Number(live.vestingTerm) / DAY),
          },
          {
            name: 'endTime',
            label: 'Closes',
            description:
              live === undefined
                ? 'Can only come earlier'
                : `Can only come earlier. Between the open at ${asDateTime(live.startTime)} and the ${asDateTime(live.endTime)} it closes now.`,
            inputType: 'datetime',
            writeOnly: true,
            preview: asDateTime,
          },
        ]}
        contractAddress={ADDRESSES.BONDING}
        abi={BONDING_ABI}
        writeFunctionName="retuneSeries"
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />

      <AdminMultiInputCard
        title="Open or close a series"
        description="A series has to be closed before another can be created."
        requireAllFields={true}
        fields={[
          {
            name: 'seriesId',
            label: 'Series',
            description: whichSeries('change'),
            inputType: 'uint16',
            writeOnly: true,
            placeholder: liveId === undefined ? '0' : String(liveId),
          },
          {
            name: 'isActive',
            label: 'State',
            description:
              'Reopening one priced under the current NAV is refused',
            inputType: 'checkbox',
            writeOnly: true,
          },
        ]}
        contractAddress={ADDRESSES.BONDING}
        abi={BONDING_ABI}
        writeFunctionName="setSeriesActive"
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />

      {/* The contract caps these two shares; the Treasury keeps the rest. */}
      <AdminMultiInputCard
        title="Where a bond's bitcoin goes"
        description="The Treasury keeps everything these two leave behind, so raising either lowers the backing each bond brings in."
        requireAllFields={true}
        validate={(values) => {
          const liquidity = parseFloat(values.liquidityBps);
          const dev = parseFloat(values.devBps);
          if (!Number.isNaN(liquidity) && !Number.isNaN(dev)) {
            const treasury = 100 - liquidity - dev;
            if (treasury <= 0) {
              return {
                liquidityBps: 'Nothing would be left for the Treasury',
              };
            }
          }
          return null;
        }}
        fields={[
          {
            name: 'liquidityBps',
            label: 'To the pool',
            description: 'Paired into the STRAT/cbBTC pool as liquidity',
            inputType: 'bps',
            unit: '%',
            readFunctionName: 'liquidityBps',
            bound: { fn: 'MAX_LIQUIDITY_BPS', kind: 'max' },
            placeholder: '6',
          },
          {
            name: 'devBps',
            label: 'To the dev wallet',
            description: 'Leaves the protocol entirely',
            inputType: 'bps',
            unit: '%',
            readFunctionName: 'devBps',
            bound: { fn: 'MAX_DEV_BPS', kind: 'max' },
            placeholder: '2',
          },
        ]}
        contractAddress={ADDRESSES.BONDING}
        abi={BONDING_ABI}
        writeFunctionName="setProceedsRouting"
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />

      <AdminSettingCard
        config={{
          label: 'Bond swap slippage',
          description:
            'How far the pool leg of a bond may move the price before the bond defers it to the next one instead',
          inputType: 'bps',
          unit: '%',
          placeholder: '3',
          bound: { fn: 'MAX_SWAP_SLIPPAGE_BPS', kind: 'max' },
        }}
        contractAddress={ADDRESSES.BONDING}
        abi={BONDING_ABI}
        readFunctionName="bondSwapSlippageBps"
        writeFunctionName="setSwapSlippageBps"
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />

      <AdminSettingCard
        config={{
          label: 'Dev wallet',
          description: 'Receives the dev share of every bond',
          inputType: 'address',
        }}
        contractAddress={ADDRESSES.BONDING}
        abi={BONDING_ABI}
        readFunctionName="devWallet"
        writeFunctionName="setDevWallet"
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />

      <AdminSettingCard
        config={{
          label: 'Price oracle',
          description: 'Prices the pool leg and the NAV floor',
          inputType: 'address',
        }}
        contractAddress={ADDRESSES.BONDING}
        abi={BONDING_ABI}
        readFunctionName="priceOracle"
        writeFunctionName="setPriceOracle"
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />

      <AdminSettingCard
        config={{
          label: 'Swap executor',
          description: 'Routes the pool leg into the pool',
          inputType: 'address',
        }}
        contractAddress={ADDRESSES.BONDING}
        abi={BONDING_ABI}
        readFunctionName="swapExecutor"
        writeFunctionName="setSwapExecutor"
        isAdminMode={isAdminMode}
        isCorrectNetwork={isCorrectNetwork}
      />
    </ContractSection>
  );
}
