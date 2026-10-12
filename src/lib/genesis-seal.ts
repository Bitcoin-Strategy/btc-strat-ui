import {
  getAbiItem,
  toFunctionSelector,
  type Abi,
  type AbiFunction,
} from 'viem';

import { BONDING_ABI } from './abi/bonding';
import { PREMIUM_SALES_ABI } from './abi/premium-sales';
import { ADDRESSES } from './addresses';

/** F-06: STRAT-selling calls move to the upgrade track at the end of Genesis. Mirrors the contracts' `seal-genesis.ts`. */
const RESERVED = [
  {
    label: 'Bonding.createSeries',
    target: ADDRESSES.BONDING,
    abi: BONDING_ABI,
    fn: 'createSeries',
  },
  {
    label: 'PremiumSales.setSwapExecutor',
    target: ADDRESSES.PREMIUM_SALES,
    abi: PREMIUM_SALES_ABI,
    fn: 'setSwapExecutor',
  },
  {
    label: 'PremiumSales.setBands',
    target: ADDRESSES.PREMIUM_SALES,
    abi: PREMIUM_SALES_ABI,
    fn: 'setBands',
  },
  {
    label: 'PremiumSales.setWindowLength',
    target: ADDRESSES.PREMIUM_SALES,
    abi: PREMIUM_SALES_ABI,
    fn: 'setWindowLength',
  },
] as const;

export type ReservedCall = {
  label: string;
  target: `0x${string}`;
  selector: `0x${string}`;
};

export const DAO_RESERVED_CALLS: ReservedCall[] = RESERVED.map(
  ({ label, target, abi, fn }) => ({
    label,
    target,
    selector: toFunctionSelector(
      getAbiItem({ abi: abi as unknown as Abi, name: fn }) as AbiFunction,
    ),
  }),
);
