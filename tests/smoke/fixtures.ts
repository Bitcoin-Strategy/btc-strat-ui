import { test as base, expect, type Page } from '@playwright/test';
import {
  decodeFunctionData,
  encodeAbiParameters,
  encodeErrorResult,
  encodeEventTopics,
  encodeFunctionResult,
  multicall3Abi,
  toFunctionSelector,
  toHex,
  zeroAddress,
  type Abi,
  type AbiFunction,
  type AbiParameter,
  type Hex,
} from 'viem';

import { ADDRESSES, CHAIN, SUBGRAPH } from '../../src/config';
import { AUTHORITY_ABI } from '../../src/lib/abi/authority';
import { BONDING_ABI } from '../../src/lib/abi/bonding';
import { CHAINLINK_AGGREGATOR_ABI } from '../../src/lib/abi/chainlink';
import { ERC20_ABI } from '../../src/lib/abi/erc20';
import { GOVERNOR_ABI } from '../../src/lib/abi/governor';
import { POOL_HOOK_ABI } from '../../src/lib/abi/pool-hook';
import { PREMIUM_SALES_ABI } from '../../src/lib/abi/premium-sales';
import { PROTOCOL_ORACLE_ABI } from '../../src/lib/abi/protocol-oracle';
import { PROTOCOL_READER_ABI } from '../../src/lib/abi/protocol-reader';
import { REDEMPTION_ABI } from '../../src/lib/abi/redemption';
import { STAKING_ABI } from '../../src/lib/abi/staking';
import { STRAT_ABI } from '../../src/lib/abi/strat';
import { TIMELOCK_ABI } from '../../src/lib/abi/timelock';
import { TREASURY_ABI } from '../../src/lib/abi/treasury';
import { VESTING_ABI } from '../../src/lib/abi/vesting';

export const ACCOUNT = '0x1234567890123456789012345678901234567890';

export const STRAT = ADDRESSES.STRAT;
export const STAKING = ADDRESSES.STAKING;
const BTC = ADDRESSES.BTC;

const SUBGRAPH_HOST = new URL(SUBGRAPH.url).hostname;
const HASH = `0x${'1'.repeat(64)}`;
const ALL_ABIS = [
  AUTHORITY_ABI,
  BONDING_ABI,
  CHAINLINK_AGGREGATOR_ABI,
  ERC20_ABI,
  GOVERNOR_ABI,
  POOL_HOOK_ABI,
  PREMIUM_SALES_ABI,
  PROTOCOL_ORACLE_ABI,
  PROTOCOL_READER_ABI,
  REDEMPTION_ABI,
  STAKING_ABI,
  STRAT_ABI,
  TIMELOCK_ABI,
  TREASURY_ABI,
  VESTING_ABI,
  multicall3Abi,
].flat() as Abi;

const functions = new Map(
  ALL_ABIS.filter((item): item is AbiFunction => item.type === 'function').map(
    (item) => [toFunctionSelector(item), item],
  ),
);

function emptyValue(parameter: AbiParameter): unknown {
  if (parameter.type.endsWith('[]')) return [];
  if (parameter.type === 'tuple' && 'components' in parameter) {
    return parameter.components.map(emptyValue);
  }
  if (parameter.type === 'address') return zeroAddress;
  if (parameter.type === 'bool') return false;
  if (parameter.type === 'string') return '';
  if (parameter.type === 'bytes') return '0x';
  if (parameter.type.startsWith('bytes'))
    return `0x${'00'.repeat(Number(parameter.type.slice(5)))}`;
  return 0n;
}

/** Per-page read overrides on top of the default fixture world. */
const readOverrides = new WeakMap<Page, Record<string, unknown>>();
const logOverrides = new WeakMap<Page, ProposalLog[]>();

/** Makes a read revert, e.g. the oracle before the pool has a TWAP window. */
export const REVERT = Symbol('revert');

/** Reverts with a named custom error, for screens that tell errors apart. */
export const revertWith = (errorName: string) => ({ __revert: errorName });

type RevertWith = { __revert: string };

const isRevertWith = (value: unknown): value is RevertWith =>
  typeof value === 'object' && value !== null && '__revert' in value;

const errorsByName = new Map(
  ALL_ABIS.filter((item) => item.type === 'error').map((item) => [
    (item as { name: string }).name,
    item,
  ]),
);

/** Call before navigating. */
export function setReads(page: Page, values: Record<string, unknown>) {
  readOverrides.set(page, { ...readOverrides.get(page), ...values });
}

export type ProposalLog = {
  id: bigint;
  /** Defaults to the parameter track. */
  governor?: `0x${string}`;
  proposer?: `0x${string}`;
  targets: readonly `0x${string}`[];
  calldatas: readonly `0x${string}`[];
  voteStart: bigint;
  voteEnd: bigint;
  description: string;
  blockNumber?: bigint;
};

/** Logs returned by `eth_getLogs`. The address filter is honoured, since each governor is scanned separately. */
export function setProposalLogs(page: Page, proposals: ProposalLog[]) {
  logOverrides.set(page, proposals);
}

const encodeProposalLog = (proposal: ProposalLog) => {
  const event = GOVERNOR_ABI.find(
    (item) => item.type === 'event' && item.name === 'ProposalCreated',
  ) as { inputs: readonly AbiParameter[] };

  return {
    address: proposal.governor ?? ADDRESSES.PARAMS_GOVERNOR,
    topics: encodeEventTopics({
      abi: GOVERNOR_ABI,
      eventName: 'ProposalCreated',
    }),
    data: encodeAbiParameters(event.inputs, [
      proposal.id,
      proposal.proposer ?? ACCOUNT,
      proposal.targets,
      proposal.calldatas.map(() => 0n),
      proposal.calldatas.map(() => ''),
      proposal.calldatas,
      proposal.voteStart,
      proposal.voteEnd,
      proposal.description,
    ]),
    blockNumber: toHex(proposal.blockNumber ?? 123_000_000n),
    blockHash: HASH,
    transactionHash: HASH,
    transactionIndex: '0x0',
    logIndex: '0x0',
    removed: false,
  };
};

class ReadReverted extends Error {
  data: Hex;

  constructor(message: string, data: Hex = '0x') {
    super(message);
    this.data = data;
  }
}

function contractResult(data: Hex, overrides: Record<string, unknown>): Hex {
  const fn = functions.get(data.slice(0, 10) as Hex);
  if (!fn) throw new Error(`Unexpected contract call: ${data.slice(0, 10)}`);
  const now = BigInt(Math.floor(Date.now() / 1000));
  const values: Record<string, unknown> = {
    getDashboard: [
      10n ** 18n,
      10n ** 14n,
      10_000n * 10n ** 18n,
      100_000_000n,
      8_000n * 10n ** 18n,
      500n * 10n ** 18n,
    ],
    navBtcPerStrat: 10n ** 14n,
    getPriceWad: 12n * 10n ** 13n,
    latestRoundData: [1n, 60_000n * 10n ** 8n, now, now, 1n],
    BTC_TOKEN: BTC,
    stratToken: STRAT,
    symbol: 'cbBTC',
    decimals: 8,
    balanceOf: 100_000_000n,

    // Both tracks read the same mocked values.
    quorumVotes: 2_000n * 10n ** 18n,
    MAJORITY_BPS: 5_001n,
    proposalThreshold: 100n * 10n ** 18n,
    votingDelay: 0n,
    votingPeriod: 3n * 86_400n,
    lateQuorumVoteExtension: 2n * 86_400n,
    VOTE_LOOKBACK: 30n * 86_400n,
    getMinDelay: 2n * 86_400n,
    clock: now,
    getVotes: 500n * 10n ** 18n,
    delegates: zeroAddress,
    escrowOf: zeroAddress,

    state: 1,
    proposalVotes: [0n, 1_500n * 10n ** 18n, 600n * 10n ** 18n],
    proposalDeadline: now + 86_400n,
    proposalEta: 0n,
    hasVoted: false,

    admin: ACCOUNT,
    controller: ACCOUNT,
    genesisFinalized: false,
    // Part-filled, so retune bounds are real.
    nextSeriesId: 1,
    liveSeries: [true, 0],
    getSeries: {
      id: 0,
      priceBtcPerStrat: 2_200_000_000_000n,
      startTime: 1_790_836_910n,
      endTime: 1_793_428_907n,
      vestingTerm: 15_552_000n,
      capacityMstrat: 1_000_000n * 10n ** 18n,
      filledMstrat: 100_000n * 10n ** 18n,
      minPurchaseBtc: 10_000n,
      isActive: true,
    },
    MAX_REDEMPTION_PAYOUT_BPS: 9_500,
    MAX_BTC_OUTFLOW_BPS: 5,
    MAX_STRAT_OUTFLOW_BPS: 1_000,
    btcOutflowBps: 5,
    stratOutflowBps: 1_000,
    MAX_LIQUIDITY_BPS: 2_000,
    MAX_DEV_BPS: 200,
    MAX_SWAP_SLIPPAGE_BPS: 500,
    MAX_VESTING_TERM: 63_072_000n,
    liquidityBps: 600,
    devBps: 200,
    bondSwapSlippageBps: 300,
    treasuryBps: 9_200n,
    availableStratBacking: 43_000_000n * 10n ** 18n,
    MAX_SELL_BPS_PER_WINDOW: 500,
    MAX_SALE_REWARD_BPS: 200,
    MAX_SALE_SLIPPAGE_BPS: 500,
    MIN_WINDOW_LENGTH: 3_600n,
    windowLength: 3_600n,
    saleRewardBps: 25,
    saleSlippageBps: 100,
    MIN_EPOCH_DURATION: 86_400n,
    epochDuration: 604_800n,
    epochRcap: 0n,
    redeemCapacity: 400n * 10n ** 18n,
    thfMin: 2n * 10n ** 17n,
    thfMax: 95n * 10n ** 16n,
    thfMaxTime: 3_600n,
    getBands: [
      { premiumMinBps: 0, premiumMaxBps: 1_000, sellBpsPerWindow: 0 },
      { premiumMinBps: 1_000, premiumMaxBps: 2_500, sellBpsPerWindow: 50 },
      { premiumMinBps: 2_500, premiumMaxBps: 65_535, sellBpsPerWindow: 150 },
    ],

    // Non-zero cardinality: the pool has been opened.
    observationState: [5, 2048, 2048],

    // Last, so test overrides win.
    ...overrides,
  };
  const override = values[fn.name];
  if (override === REVERT) throw new ReadReverted(fn.name);
  if (isRevertWith(override)) {
    const error = errorsByName.get(override.__revert);
    if (!error) throw new Error(`no custom error named ${override.__revert}`);
    throw new ReadReverted(
      override.__revert,
      encodeErrorResult({ abi: [error], errorName: override.__revert }),
    );
  }

  let result = values[fn.name];
  // Pad short tuples so an added struct field does not break every test.
  const shape =
    fn.outputs.length === 1
      ? (fn.outputs[0] as { components?: AbiParameter[] }).components
      : undefined;
  if (Array.isArray(result) && shape && result.length < shape.length) {
    result = [...result, ...shape.slice(result.length).map(emptyValue)];
  }
  if (fn.name === 'aggregate3') {
    const { args } = decodeFunctionData({ abi: multicall3Abi, data });
    const calls = args?.[0] as readonly { callData: Hex }[];
    result = calls.map(({ callData }) => {
      try {
        return {
          success: true,
          returnData: contractResult(callData, overrides),
        };
      } catch (error) {
        if (error instanceof ReadReverted) {
          return { success: false, returnData: error.data };
        }
        throw error;
      }
    });
  }
  if (result === undefined) {
    const outputs = fn.outputs.map(emptyValue);
    result = outputs.length === 1 ? outputs[0] : outputs;
  }
  return encodeFunctionResult({
    abi: [fn] as Abi,
    functionName: fn.name,
    result,
  });
}

type RpcRequest = {
  id: number;
  method: string;
  params?: [{ data?: Hex; address?: string }];
};

function rpcResult(
  { method, params }: RpcRequest,
  overrides: Record<string, unknown>,
  logs: ProposalLog[],
): unknown {
  if (method === 'eth_call') {
    return contractResult(params?.[0]?.data ?? '0x', overrides);
  }
  if (method === 'eth_blockNumber') return toHex(123_000_000);
  if (method === 'eth_chainId') return toHex(CHAIN.id);
  if (method === 'eth_getLogs') {
    const asked = params?.[0]?.address?.toLowerCase();
    return logs
      .filter(
        (proposal) =>
          !asked ||
          (proposal.governor ?? ADDRESSES.PARAMS_GOVERNOR).toLowerCase() ===
            asked,
      )
      .map(encodeProposalLog);
  }
  if (method === 'eth_getBalance') return toHex(10n ** 18n);
  if (method === 'eth_getBlockByNumber') {
    return {
      number: toHex(123_000_000),
      hash: HASH,
      parentHash: HASH,
      timestamp: toHex(Math.floor(Date.now() / 1000)),
      gasLimit: '0x1c9c380',
      gasUsed: '0x0',
      baseFeePerGas: '0x1',
      difficulty: '0x0',
      totalDifficulty: '0x0',
      size: '0x0',
      transactions: [],
      uncles: [],
      extraData: '0x',
      miner: zeroAddress,
      nonce: '0x0000000000000000',
      logsBloom: `0x${'00'.repeat(256)}`,
      receiptsRoot: HASH,
      stateRoot: HASH,
      transactionsRoot: HASH,
      mixHash: HASH,
      sha3Uncles: HASH,
    };
  }
  throw new Error(`Unexpected RPC method: ${method}`);
}

export const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.route('https://**/*', async (route) => {
        const url = new URL(route.request().url());
        if (url.hostname === SUBGRAPH_HOST) {
          await route.fulfill({
            json: {
              data: {
                navPoints: [0, 1, 2].map((i) => ({
                  id: String(i),
                  timestamp: String(1_790_000_000 + i * 3600),
                  blockNumber: String(123_000_000 + i),
                  treasuryBtc: '100000000',
                  stratTotalSupply: '10000000000000000000000',
                  navBtcPerStratWad: String(
                    100_000_000_000_000 + i * 1_000_000_000_000,
                  ),
                  marketBtcPerStratWad: String(
                    120_000_000_000_000 + i * 1_000_000_000_000,
                  ),
                  premiumBps: 2000,
                })),
              },
            },
          });
        } else if (
          url.hostname.includes('robinhood') ||
          url.hostname.includes('publicnode')
        ) {
          const request = route.request().postDataJSON() as
            RpcRequest | RpcRequest[];
          const overrides = readOverrides.get(page) ?? {};
          const logs = logOverrides.get(page) ?? [];
          const respond = (item: RpcRequest) => {
            try {
              return {
                jsonrpc: '2.0',
                id: item.id,
                result: rpcResult(item, overrides, logs),
              };
            } catch (error) {
              if (error instanceof ReadReverted) {
                return {
                  jsonrpc: '2.0',
                  id: item.id,
                  error: {
                    code: 3,
                    message: `execution reverted: ${error.message}`,
                    data: error.data,
                  },
                };
              }
              throw error;
            }
          };
          await route.fulfill({
            json: Array.isArray(request)
              ? request.map(respond)
              : respond(request),
          });
        } else {
          await route.fulfill({ json: {} });
        }
      });
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Marks an expected console error; any other console error still fails the test. */
export function expectReportedError(
  browserErrors: string[],
  pattern: RegExp,
): void {
  const matched = browserErrors.filter((message) => pattern.test(message));
  expect(
    matched,
    `expected the app to report an error matching ${pattern}`,
  ).not.toEqual([]);

  for (const message of matched) {
    browserErrors.splice(browserErrors.indexOf(message), 1);
  }
}

export async function injectWallet(page: Page, chainId: number = CHAIN.id) {
  await page.addInitScript(
    ({ address, initialChainId }) => {
      let chain = initialChainId;
      const listeners = new Map<string, Set<(value: unknown) => void>>();
      const emit = (event: string, value: unknown) =>
        listeners.get(event)?.forEach((fn) => fn(value));
      const provider = {
        on(event: string, listener: (value: unknown) => void) {
          if (!listeners.has(event)) listeners.set(event, new Set());
          listeners.get(event)!.add(listener);
          return provider;
        },
        removeListener(event: string, listener: (value: unknown) => void) {
          listeners.get(event)?.delete(listener);
          return provider;
        },
        async request({
          method,
          params,
        }: {
          method: string;
          params?: [{ chainId?: string }];
        }) {
          if (method === 'eth_accounts')
            return localStorage.getItem('test-wallet-connected')
              ? [address]
              : [];
          if (
            method === 'eth_requestAccounts' ||
            method === 'wallet_requestPermissions'
          ) {
            localStorage.setItem('test-wallet-connected', 'yes');
            emit('accountsChanged', [address]);
            return method === 'eth_requestAccounts'
              ? [address]
              : [{ parentCapability: 'eth_accounts' }];
          }
          if (method === 'wallet_revokePermissions') {
            localStorage.removeItem('test-wallet-connected');
            emit('accountsChanged', []);
            return null;
          }
          if (method === 'eth_chainId') return `0x${chain.toString(16)}`;
          if (method === 'wallet_switchEthereumChain') {
            chain = Number(params?.[0]?.chainId);
            localStorage.setItem('test-wallet-chain', String(chain));
            emit('chainChanged', `0x${chain.toString(16)}`);
            return null;
          }
          if (method === 'eth_sendTransaction') {
            localStorage.setItem(
              'test-wallet-transaction',
              JSON.stringify(params?.[0]),
            );
            throw Object.assign(new Error('User rejected the request'), {
              code: 4001,
            });
          }
          throw new Error(`Unexpected wallet request: ${method}`);
        },
      };
      const announce = () =>
        window.dispatchEvent(
          new CustomEvent('eip6963:announceProvider', {
            detail: {
              info: {
                uuid: '350670db-19fa-4704-a166-e52e178b59d2',
                name: 'Test Wallet',
                rdns: 'test.wallet',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
              },
              provider,
            },
          }),
        );
      window.addEventListener('eip6963:requestProvider', announce);
      announce();
    },
    { address: ACCOUNT, initialChainId: chainId },
  );
}
