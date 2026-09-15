import {
  expect,
  injectWallet,
  REVERT,
  revertWith,
  setReads,
  test,
} from './fixtures';

/** Before the auction: no pool, no series, empty Treasury. Nothing may offer an action that cannot work. */
const preLaunch = {
  observationState: [0, 0, 0],
  // `PremiumSales` surfaces the oracle refusal as `OracleNotReady`.
  getPriceWad: REVERT,
  currentPremiumBps: revertWith('OracleNotReady'),
  liveSeries: [false, 0],
  nextSeriesId: 0,
  navBtcPerStrat: 0n,
  balanceOf: 0n,
  totalStaked: 0n,
};

const ROUTES = [
  '/',
  '/bonding',
  '/redemption',
  '/vesting',
  '/governance',
] as const;

test('every page renders, with the notice and without a crash', async ({
  page,
  browserErrors,
}) => {
  setReads(page, preLaunch);

  for (const route of ROUTES) {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByText('Genesis auction on the way')).toBeVisible();
    await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);
  }

  expect(browserErrors).toEqual([]);
});

test('the premium sale explains itself rather than offering a dead button', async ({
  page,
}) => {
  setReads(page, preLaunch);
  await injectWallet(page);
  await page.goto('/');

  await expect(
    page.getByText('The Treasury holds no bitcoin yet', { exact: false }),
  ).toBeVisible();
});

test('bonding offers nothing to bond into while no series is open', async ({
  page,
}) => {
  setReads(page, preLaunch);
  await injectWallet(page);
  await page.goto('/bonding');

  const buttons = page.locator('main button:enabled');
  const labels = await buttons.allInnerTexts();
  expect(
    labels.filter((label) => /^(bond|buy|confirm)/i.test(label.trim())),
    'no enabled bond action without a series',
  ).toEqual([]);
});

test('the oracle refusing to price STRAT is reported, not swallowed', async ({
  page,
}) => {
  setReads(page, { ...preLaunch, navBtcPerStrat: 10n ** 14n });
  await page.goto('/');

  await expect(
    page.getByText('less price history than the oracle window needs', {
      exact: false,
    }),
  ).toBeVisible();
});
