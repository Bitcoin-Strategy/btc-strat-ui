import { decodeFunctionData, erc20Abi, maxUint256 } from 'viem';

import { expect, injectWallet, STAKING, STRAT, test } from './fixtures';

import { CHAIN } from '../../src/config';

const CONNECT_WALLET = 'Connect Wallet';

const pages = [
  ['/', 'Protocol Dashboard'],
  ['/bonding', 'Bonding & Vesting'],
  ['/vesting', 'Vesting Dashboard'],
  ['/redemption', 'Staking & Redemption'],
  ['/governance', 'Governance'],
  ['/system-parameters', 'System Parameters'],
];

for (const [path, heading] of pages) {
  test(`production route ${path} renders`, async ({ page }) => {
    await page.goto(path);
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: CONNECT_WALLET, exact: true }),
    ).toBeVisible();
    if (path === '/') {
      await expect(page.locator('.recharts-area-curve').first()).toBeVisible();
      await expect(
        page.getByText('1.00 BTC', { exact: true }).first(),
      ).toBeVisible();
    }
  });
}

test('MetaMask SDK loads without an installed extension', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: CONNECT_WALLET, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('button', { name: 'MetaMask', exact: true }),
  ).toBeEnabled();
  await expect(
    dialog.getByRole('button', { name: 'Injected', exact: true }),
  ).toBeDisabled();
});

test('injected wallet connects, survives reload, switches chain and disconnects', async ({
  page,
}) => {
  await injectWallet(page, 1);
  await page.goto('/');
  await page.getByRole('button', { name: CONNECT_WALLET, exact: true }).click();
  await page.getByRole('button', { name: 'Test Wallet', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '0x1234…7890', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Your wallet is on another network'),
  ).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('test-wallet-chain')))
    .toBe(String(CHAIN.id));
  await page.reload();
  await expect(
    page.getByRole('button', { name: '0x1234…7890', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Disconnect wallet' }).click();
  await expect(
    page.getByRole('button', { name: CONNECT_WALLET, exact: true }),
  ).toBeVisible();
});

test('contract approval reaches the wallet with correct calldata and handles rejection', async ({
  page,
}) => {
  await injectWallet(page);
  await page.goto('/redemption');
  await page.getByRole('button', { name: CONNECT_WALLET, exact: true }).click();
  await page.getByRole('button', { name: 'Test Wallet', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '0x1234…7890', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('spinbutton', { name: 'Amount to Stake' })
    .fill('0.00000000001');
  await page
    .getByRole('button', { name: 'Approve & Stake', exact: true })
    .click();
  await expect(page.getByText('Cancelled', { exact: true })).toBeVisible();
  const raw = await page.evaluate(() =>
    localStorage.getItem('test-wallet-transaction'),
  );
  expect(raw).not.toBeNull();
  const transaction = JSON.parse(raw!) as { to: string; data: `0x${string}` };
  expect(transaction.to.toLowerCase()).toBe(STRAT);
  const call = decodeFunctionData({ abi: erc20Abi, data: transaction.data });
  expect(call.functionName).toBe('approve');
  expect(call.args).toEqual([
    expect.stringMatching(new RegExp(STAKING, 'i')),
    maxUint256,
  ]);
  await expect(
    page.getByRole('button', { name: 'Approve & Stake', exact: true }),
  ).toBeEnabled();
});
