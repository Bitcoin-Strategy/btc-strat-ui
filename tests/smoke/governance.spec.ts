import type { Page } from '@playwright/test';
import { encodeFunctionData } from 'viem';

import {
  REVERT,
  expect,
  expectReportedError,
  injectWallet,
  revertWith,
  setProposalLogs,
  setReads,
  test,
  type ProposalLog,
} from './fixtures';

import { ADDRESSES } from '../../src/config';
import { AUTHORITY_ABI } from '../../src/lib/abi/authority';
import { PREMIUM_SALES_ABI } from '../../src/lib/abi/premium-sales';

const STRAT = (whole: bigint) => whole * 10n ** 18n;

const connect = async (page: Page) => {
  await page
    .getByRole('button', { name: 'Connect Wallet', exact: true })
    .click();
  await page.getByRole('button', { name: /Test Wallet/ }).click();
};
const now = () => BigInt(Math.floor(Date.now() / 1000));

const slippageCall = encodeFunctionData({
  abi: AUTHORITY_ABI,
  functionName: 'execute',
  args: [
    ADDRESSES.PREMIUM_SALES,
    encodeFunctionData({
      abi: PREMIUM_SALES_ABI,
      functionName: 'setSaleSlippageBps',
      args: [250],
    }),
  ],
});

const proposal = (overrides: Partial<ProposalLog> = {}): ProposalLog => ({
  id: 42n,
  targets: [ADDRESSES.AUTHORITY],
  calldatas: [slippageCall],
  voteStart: now() - 3_600n,
  voteEnd: now() + 86_400n,
  description:
    'MIP-1: tighten sale slippage to 2.5%\nThe pool is deep enough to hold it now.',
  ...overrides,
});

const HEADING = 'Governance';
const PAGE = '/governance';

const daoActive = { genesisFinalized: true };

test('the tracks state what they require, including the weight they will not count', async ({
  page,
}) => {
  setReads(page, daoActive);
  await page.goto(PAGE);

  await expect(
    page.getByRole('heading', { name: HEADING, exact: true }),
  ).toBeVisible();

  await expect(page.getByText('Parameters track')).toBeVisible();
  await expect(page.getByText('Upgrades track')).toBeVisible();
  await expect(page.getByText('2.0k votes').first()).toBeVisible();
  await expect(page.getByText('50.01%').first()).toBeVisible();
  await expect(page.getByText('2d 0h').first()).toBeVisible();

  await expect(
    page.getByText(/Weight is counted 30d 0h in the past/).first(),
  ).toBeVisible();
});

test('a proposal opposed into the ground does not claim to have reached quorum', async ({
  page,
}) => {
  // Against does not count toward quorum, so 2,500 votes cast is still short of 2,000.
  setReads(page, {
    ...daoActive,
    proposalVotes: [STRAT(1_000n), STRAT(1_500n), 0n],
    state: 1,
    proposalDeadline: now() + 86_400n,
    proposalEta: 0n,
  });
  setProposalLogs(page, [proposal()]);
  await page.goto(PAGE);

  await expect(
    page.getByRole('heading', { name: 'MIP-1: tighten sale slippage to 2.5%' }),
  ).toBeVisible();

  await expect(page.getByText('1.5k / 2.0k')).toBeVisible();
  // Ignore the quote glyph.
  await expect(page.getByText(/Counts .for. and .abstain./)).toBeVisible();
  await expect(page.getByText(/votes short of quorum/)).toBeVisible();
  await expect(page.getByText('reached', { exact: true })).toHaveCount(0);
});

test('abstentions carry a proposal to quorum without deciding it', async ({
  page,
}) => {
  setReads(page, {
    ...daoActive,
    proposalVotes: [0n, STRAT(1_500n), STRAT(600n)],
    state: 1,
  });
  setProposalLogs(page, [proposal()]);
  await page.goto(PAGE);

  await expect(page.getByText('2.1k / 2.0k')).toBeVisible();
  await expect(page.getByText(/Passing on both counts/)).toBeVisible();
});

test('a voter can read what a proposal executes, in words', async ({
  page,
}) => {
  setReads(page, { ...daoActive, state: 1 });
  setProposalLogs(page, [proposal()]);
  await page.goto(PAGE);

  await page.getByRole('button', { name: /Show what this executes/ }).click();

  await expect(page.getByText('2.5%', { exact: true })).toBeVisible();
  await expect(page.getByText(ADDRESSES.PREMIUM_SALES)).toBeVisible();
});

test('an undecodable proposal says so rather than looking empty', async ({
  page,
}) => {
  setReads(page, { ...daoActive, state: 1 });
  setProposalLogs(page, [
    proposal({
      calldatas: ['0xdeadbeef'],
      description: 'MIP-2: something this app cannot read',
    }),
  ]);
  await page.goto(PAGE);

  await page.getByRole('button', { name: /Show what this executes/ }).click();
  await expect(page.getByText(/could not be decoded/)).toBeVisible();
  await expect(page.getByText(/Read the calldata before voting/)).toBeVisible();
});

test('execute is held shut until the timelock releases it, and says why', async ({
  page,
}) => {
  setReads(page, {
    ...daoActive,
    state: 5,
    proposalEta: now() + 2n * 86_400n,
    proposalVotes: [0n, STRAT(2_500n), 0n],
  });
  setProposalLogs(page, [proposal()]);
  await injectWallet(page);
  await page.goto(PAGE);
  await connect(page);

  const execute = page.getByRole('button', { name: 'Execute', exact: true });
  await expect(execute).toBeVisible();
  await expect(execute).toBeDisabled();
  // Seconds pass before render, so match any duration.
  await expect(
    page.getByText(/The timelock releases it in \d+d \d+h/),
  ).toBeVisible();
});

test('execute opens once the timelock has released it', async ({ page }) => {
  setReads(page, {
    ...daoActive,
    state: 5,
    proposalEta: now() - 60n,
    proposalVotes: [0n, STRAT(2_500n), 0n],
  });
  setProposalLogs(page, [proposal()]);
  await injectWallet(page);
  await page.goto(PAGE);
  await connect(page);

  await expect(
    page.getByRole('button', { name: 'Execute', exact: true }),
  ).toBeEnabled();
});

test('declining a vote in the wallet is not reported as a failure', async ({
  page,
  browserErrors,
}) => {
  setReads(page, {
    ...daoActive,
    state: 1,
    proposalVotes: [0n, STRAT(500n), 0n],
  });
  setProposalLogs(page, [proposal()]);
  await injectWallet(page);
  await page.goto(PAGE);
  await connect(page);

  // The wallet fixture rejects every transaction.
  await page.getByRole('button', { name: 'For', exact: true }).click();

  await expect(page.getByText('Cancelled')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'For', exact: true }),
  ).toBeEnabled();
  await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);

  const sent = await page.evaluate(() =>
    localStorage.getItem('test-wallet-transaction'),
  );
  expect(sent).toContain('0x');
  expect(browserErrors).toEqual([]);
});

test('every proposal is listed, and the open filter narrows to what can still move', async ({
  page,
}) => {
  setReads(page, { ...daoActive, state: 7 });
  setProposalLogs(page, [
    proposal({ id: 1n, description: 'MIP-1: the first one' }),
    proposal({ id: 2n, description: 'MIP-2: the second one' }),
  ]);
  await page.goto(PAGE);

  await expect(page.getByText('Nothing open right now')).toBeVisible();

  await page.getByRole('button', { name: /^All \(/ }).click();
  await expect(page.getByText('MIP-1: the first one')).toBeVisible();
  await expect(page.getByText('MIP-2: the second one')).toBeVisible();
});

test('a quorum it cannot read is reported, never guessed at', async ({
  page,
  browserErrors,
}) => {
  // A default quorum of zero would show every proposal as passing.
  setReads(page, { ...daoActive, quorumVotes: REVERT, state: 1 });
  setProposalLogs(page, [proposal()]);
  await page.goto(PAGE);

  await expect(
    page.getByRole('heading', { name: HEADING, exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Could not read proposals')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeEnabled();

  await expect(page.getByText('reached', { exact: true })).toHaveCount(0);

  expectReportedError(
    browserErrors,
    /Could not read what the parameters track requires/,
  );
});

test('proposing is refused in the track’s own terms when weight is read from the past', async ({
  page,
}) => {
  setReads(page, {
    ...daoActive,
    getVotes: STRAT(10n),
  });
  await injectWallet(page);
  await page.goto(PAGE);
  await connect(page);

  await page.getByRole('button', { name: 'New proposal' }).click();

  await expect(
    page.getByText(/counts weight as it stood 30d 0h ago rather than now/),
  ).toBeVisible();
});

test('governance is closed during Genesis and says what opens it', async ({
  page,
}) => {
  setReads(page, { genesisFinalized: false });
  await page.goto(PAGE);

  await expect(page.getByText('Genesis is still open')).toBeVisible();
  await expect(page.getByRole('button', { name: 'New proposal' })).toHaveCount(
    0,
  );
  await expect(page.getByText('Parameters track')).toBeVisible();
});

test('a wallet that never delegated is told its STRAT counts for nobody', async ({
  page,
}) => {
  setReads(page, {
    ...daoActive,
    balanceOf: STRAT(1_000n),
    delegates: '0x0000000000000000000000000000000000000000',
    getVotes: 0n,
  });
  await injectWallet(page);
  await page.goto(PAGE);
  await connect(page);

  await expect(page.getByText(/STRAT counts for nobody/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Delegate to myself' }),
  ).toBeEnabled();
});

test('an oracle that cannot price the pool does not take the page down', async ({
  page,
  browserErrors,
}) => {
  setReads(page, {
    ...daoActive,
    getPriceWad: revertWith('OracleNotReady'),
    state: 1,
  });
  setProposalLogs(page, [proposal()]);
  await page.goto(PAGE);

  await expect(
    page.getByRole('heading', { name: 'MIP-1: tighten sale slippage to 2.5%' }),
  ).toBeVisible();
  expect(browserErrors).toEqual([]);
});
