import { parseUnits, type Abi } from 'viem';

import { BONDING_ABI } from './abi/bonding';
import { PREMIUM_SALES_ABI } from './abi/premium-sales';
import { PROTOCOL_ORACLE_ABI } from './abi/protocol-oracle';
import { REDEMPTION_ABI } from './abi/redemption';
import { STAKING_ABI } from './abi/staking';
import { TREASURY_ABI } from './abi/treasury';
import { ADDRESSES } from './addresses';
import type { TrackKey } from './governance';

/** Each action fixes its track: the authority refuses restricted selectors from the parameter track. */

export type FieldKind =
  | 'bps'
  | 'btc'
  | 'strat'
  | 'wad'
  | 'days'
  | 'seconds'
  | 'address'
  | 'uint'
  | 'bool'
  | 'datetime'
  | 'hex';

export type ActionField = {
  name: string;
  label: string;
  kind: FieldKind;
  help?: string;
  placeholder?: string;
};

export type ProposalAction = {
  key: string;
  label: string;
  summary: string;
  track: TrackKey;
  target: `0x${string}`;
  abi: Abi;
  functionName: string;
  fields: ActionField[];
};

export const encodeField = (kind: FieldKind, raw: string): unknown => {
  const text = raw.trim();
  switch (kind) {
    case 'bps':
      return Math.round(parseFloat(text) * 100);
    case 'btc':
      return parseUnits(text, 8);
    case 'strat':
    case 'wad':
      return parseUnits(text, 18);
    case 'days':
      return BigInt(Math.round(parseFloat(text) * 86_400));
    case 'seconds':
      return BigInt(Math.round(parseFloat(text)));
    case 'datetime':
      return BigInt(Math.floor(new Date(text).getTime() / 1000));
    case 'uint':
      return BigInt(text);
    case 'bool':
      return text === 'true';
    case 'address':
    case 'hex':
      return text as `0x${string}`;
  }
};

export const fieldError = (kind: FieldKind, raw: string): string | null => {
  const text = raw.trim();
  if (!text) return 'Required';
  switch (kind) {
    case 'address':
      return /^0x[0-9a-fA-F]{40}$/.test(text) ? null : 'Not an address';
    case 'hex':
      return /^0x[0-9a-fA-F]*$/.test(text) ? null : 'Not hex data';
    case 'bool':
      return text === 'true' || text === 'false' ? null : 'true or false';
    case 'uint':
      return /^\d+$/.test(text) ? null : 'Whole number';
    default:
      return Number.isFinite(parseFloat(text)) && parseFloat(text) >= 0
        ? null
        : 'Not a number';
  }
};

export const PROPOSAL_ACTIONS: ProposalAction[] = [
  {
    key: 'redemption-epoch',
    label: 'Redemption — epoch and capacity',
    summary:
      'Sets how long a redemption epoch lasts and how much STRAT may be redeemed within one. A capacity of 0 switches redemption off.',
    track: 'params',
    target: ADDRESSES.REDEMPTION,
    abi: REDEMPTION_ABI as unknown as Abi,
    functionName: 'setEpochConfig',
    fields: [
      {
        name: 'duration',
        label: 'Epoch length',
        kind: 'days',
        help: 'In days. The contract refuses anything under one.',
        placeholder: '7',
      },
      {
        name: 'rcap',
        label: 'Capacity per epoch',
        kind: 'strat',
        help: 'STRAT redeemable in one epoch. 0 switches redemption off.',
        placeholder: '100000',
      },
    ],
  },
  {
    key: 'treasury-btc-outflow',
    label: 'Treasury — bitcoin outflow limit',
    summary:
      'The share of the bitcoin balance that may leave per week, refilling continuously. It can never exceed the ceiling fixed at deployment.',
    track: 'params',
    target: ADDRESSES.TREASURY,
    abi: TREASURY_ABI as unknown as Abi,
    functionName: 'setBtcOutflowBps',
    fields: [
      {
        name: 'newBps',
        label: 'Limit',
        kind: 'bps',
        help: 'Percentage of the balance, per week.',
        placeholder: '20',
      },
    ],
  },
  {
    key: 'treasury-strat-outflow',
    label: 'Treasury — STRAT outflow limit',
    summary:
      'The same limit, for the Treasury’s STRAT rather than its bitcoin.',
    track: 'params',
    target: ADDRESSES.TREASURY,
    abi: TREASURY_ABI as unknown as Abi,
    functionName: 'setStratOutflowBps',
    fields: [
      {
        name: 'newBps',
        label: 'Limit',
        kind: 'bps',
        placeholder: '10',
      },
    ],
  },
  {
    key: 'premium-window',
    label: 'Premium sales — window length',
    summary:
      'How long a selling window lasts. The band cap is measured per window, so a shorter window sells the same share more often.',
    track: 'params',
    target: ADDRESSES.PREMIUM_SALES,
    abi: PREMIUM_SALES_ABI as unknown as Abi,
    functionName: 'setWindowLength',
    fields: [
      {
        name: 'windowLength',
        label: 'Window',
        kind: 'seconds',
        help: 'In seconds. The contract refuses anything under an hour.',
        placeholder: '86400',
      },
    ],
  },
  {
    key: 'premium-reward',
    label: 'Premium sales — executor reward',
    summary:
      'What a keeper earns for running a sale, and the most any single sale may pay them. Both are cut down to the sale’s surplus over NAV, so neither can reach the backing.',
    track: 'params',
    target: ADDRESSES.PREMIUM_SALES,
    abi: PREMIUM_SALES_ABI as unknown as Abi,
    functionName: 'setSaleReward',
    fields: [
      {
        name: 'rewardBps',
        label: 'Reward',
        kind: 'bps',
        help: 'Share of the proceeds.',
        placeholder: '0.25',
      },
      {
        name: 'maxRewardBtc',
        label: 'Ceiling',
        kind: 'btc',
        help: 'Most one sale may pay. 0 means no ceiling.',
        placeholder: '0',
      },
    ],
  },
  {
    key: 'premium-slippage',
    label: 'Premium sales — slippage allowance',
    summary:
      'How far under the oracle price a sale may clear. The NAV floor applies regardless, so this cannot let a sale dip into the backing.',
    track: 'params',
    target: ADDRESSES.PREMIUM_SALES,
    abi: PREMIUM_SALES_ABI as unknown as Abi,
    functionName: 'setSaleSlippageBps',
    fields: [
      {
        name: 'slippageBps',
        label: 'Allowance',
        kind: 'bps',
        placeholder: '3',
      },
    ],
  },
  {
    key: 'bonding-routing',
    label: 'Bonding — proceeds routing',
    summary:
      'The share of every bond paired into the pool and sent to the dev wallet. The Treasury keeps whatever these two leave behind.',
    track: 'params',
    target: ADDRESSES.BONDING,
    abi: BONDING_ABI as unknown as Abi,
    functionName: 'setProceedsRouting',
    fields: [
      {
        name: 'liquidityBps',
        label: 'Liquidity',
        kind: 'bps',
        placeholder: '6',
      },
      { name: 'devBps', label: 'Dev', kind: 'bps', placeholder: '2' },
    ],
  },
  {
    key: 'bonding-slippage',
    label: 'Bonding — liquidity leg slippage',
    summary:
      'How far the liquidity leg of a bond may move the pool before it is deferred to a later attempt.',
    track: 'params',
    target: ADDRESSES.BONDING,
    abi: BONDING_ABI as unknown as Abi,
    functionName: 'setSwapSlippageBps',
    fields: [
      {
        name: 'slippageBps',
        label: 'Allowance',
        kind: 'bps',
        placeholder: '3',
      },
    ],
  },
  {
    key: 'bonding-dev-wallet',
    label: 'Bonding — dev wallet',
    summary: 'Where the dev share of every bond is sent.',
    track: 'params',
    target: ADDRESSES.BONDING,
    abi: BONDING_ABI as unknown as Abi,
    functionName: 'setDevWallet',
    fields: [
      { name: 'wallet', label: 'Address', kind: 'address', placeholder: '0x…' },
    ],
  },
  {
    key: 'bonding-create-series',
    label: 'Bonding — open a series',
    summary:
      'Opens a bond series at a fixed price. One may be live at a time, and the Treasury’s net share of the price must stay at or above NAV.',
    track: 'params',
    target: ADDRESSES.BONDING,
    abi: BONDING_ABI as unknown as Abi,
    functionName: 'createSeries',
    fields: [
      {
        name: 'priceBtcPerStrat',
        label: 'Price',
        kind: 'wad',
        help: 'Bitcoin per STRAT.',
        placeholder: '0.0000024',
      },
      { name: 'startTime', label: 'Opens', kind: 'datetime' },
      { name: 'endTime', label: 'Closes', kind: 'datetime' },
      {
        name: 'vestingTerm',
        label: 'Vesting term',
        kind: 'days',
        placeholder: '30',
      },
      {
        name: 'capacityMstrat',
        label: 'Capacity',
        kind: 'strat',
        help: 'Cannot exceed what the vesting vault is holding.',
        placeholder: '1000000',
      },
      {
        name: 'minPurchaseBtc',
        label: 'Minimum bond',
        kind: 'btc',
        placeholder: '0.0001',
      },
    ],
  },
  {
    key: 'bonding-series-active',
    label: 'Bonding — close or reopen a series',
    summary:
      'A series must be closed before another can be created, so this is what precedes every new one.',
    track: 'params',
    target: ADDRESSES.BONDING,
    abi: BONDING_ABI as unknown as Abi,
    functionName: 'setSeriesActive',
    fields: [
      { name: 'seriesId', label: 'Series id', kind: 'uint', placeholder: '0' },
      { name: 'isActive', label: 'Active', kind: 'bool', placeholder: 'false' },
    ],
  },
  {
    key: 'staking-thf',
    label: 'Staking — TimeHeldFactor',
    summary:
      'The floor, ceiling, time to the ceiling and neutral point of the factor that scales what a redemption pays.',
    track: 'params',
    target: ADDRESSES.STAKING,
    abi: STAKING_ABI as unknown as Abi,
    functionName: 'setThfParams',
    fields: [
      { name: 'thfMin', label: 'Minimum', kind: 'wad', placeholder: '0.2' },
      { name: 'thfMax', label: 'Maximum', kind: 'wad', placeholder: '0.95' },
      {
        name: 'thfMaxTime',
        label: 'Time to maximum',
        kind: 'days',
        placeholder: '365',
      },
    ],
  },
  {
    key: 'oracle-set-feed',
    label: 'Oracle — repoint a price feed',
    summary:
      'Points the protocol at a different price adapter. Restricted: the authority refuses it from the parameter timelock, so it can only pass here.',
    track: 'upgrade',
    target: ADDRESSES.PROTOCOL_ORACLE,
    abi: PROTOCOL_ORACLE_ABI as unknown as Abi,
    functionName: 'setFeed',
    fields: [
      {
        name: 'base',
        label: 'Base token',
        kind: 'address',
        placeholder: ADDRESSES.STRAT,
      },
      {
        name: 'quote',
        label: 'Quote token',
        kind: 'address',
        placeholder: ADDRESSES.BTC,
      },
      {
        name: 'adapter',
        label: 'Adapter',
        kind: 'address',
        placeholder: '0x…',
      },
    ],
  },
  {
    key: 'bonding-liquidity-position',
    label: 'Bonding — liquidity adapter',
    summary:
      'Chooses the contract that holds the protocol’s own liquidity. Restricted, for the same reason a feed is.',
    track: 'upgrade',
    target: ADDRESSES.BONDING,
    abi: BONDING_ABI as unknown as Abi,
    functionName: 'setLiquidityPosition',
    fields: [
      {
        name: 'liquidityPosition',
        label: 'Adapter',
        kind: 'address',
        placeholder: '0x…',
      },
    ],
  },
];

export const RAW_ACTION_KEY = 'raw';
