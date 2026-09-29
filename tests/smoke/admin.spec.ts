import type { Page } from '@playwright/test';

import { expect, injectWallet, test } from './fixtures';

const RETUNE = 'Retune a live series';

const openPanel = async (page: Page) => {
  await injectWallet(page);
  await page.goto('/system-parameters');
  await page
    .getByRole('button', { name: 'Connect Wallet', exact: true })
    .click();
  await page.getByRole('button', { name: /Test Wallet/ }).click();
  await expect(page.getByText('Admin wallet connected')).toBeVisible();
};

const fieldByLabel = (page: Page, label: string) =>
  page.getByLabel(label, { exact: true });

const fieldIn = (page: Page, card: string, label: string) =>
  page.getByRole('region', { name: card }).getByLabel(label, { exact: true });

test('every editable field carries its unit and the value it holds now', async ({
  page,
}) => {
  await openPanel(page);

  await expect(page.getByText('0.05% a week').first()).toBeVisible();
  await expect(page.getByText('3%', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('0.2x', { exact: true })).toBeVisible();
  await expect(page.getByText('7.0 days', { exact: true })).toBeVisible();
  await expect(page.getByText('1 hour', { exact: true })).toBeVisible();
});

test('limits come off the contracts rather than out of the page', async ({
  page,
}) => {
  await openPanel(page);

  // Asserted by count: some limits appear more than once.
  await expect(page.getByText('At most 0.05% a week')).toHaveCount(1);
  await expect(page.getByText('At most 20%')).toHaveCount(1);
  await expect(page.getByText('At least 1.0 days')).toHaveCount(1);
  await expect(page.getByText('At least 1 hour')).toHaveCount(1);
  await expect(page.getByText('At most 730.0 days')).toHaveCount(2);
  await expect(page.getByText('At most 2%')).toHaveCount(2);
  await expect(page.getByText('At most 5%')).toHaveCount(2);
});

test('a rate above the deployment ceiling is refused before it costs gas', async ({
  page,
}) => {
  await openPanel(page);

  // A valid percentage above the 0.05% ceiling.
  const btcRate = fieldByLabel(page, 'BTC outflow rate');
  await btcRate.fill('20');
  await expect(
    page.getByText('The contract allows at most 0.05% a week'),
  ).toBeVisible();

  await btcRate.fill('0.04');
  await expect(
    page.getByText('The contract allows at most 0.05% a week'),
  ).toHaveCount(0);
  await expect(page.getByText('0.04% a week').first()).toBeVisible();
});

test('the time held factors are checked against each other, not one at a time', async ({
  page,
}) => {
  await openPanel(page);

  await fieldByLabel(page, 'Minimum').fill('0.5');
  await fieldByLabel(page, 'Maximum').fill('0.4');
  await expect(
    page.getByText('Cannot be below the minimum of 0.5'),
  ).toBeVisible();

  await fieldByLabel(page, 'Maximum').fill('1.4');
  await expect(page.getByText('Cannot be above 1.0')).toBeVisible();

  await fieldByLabel(page, 'Maximum').fill('0.9');
  await expect(
    page.getByText('Cannot be below the minimum of 0.5'),
  ).toHaveCount(0);
});

test('a factor that would have no effect is called out, not silently accepted', async ({
  page,
}) => {
  await openPanel(page);

  // 0.98 is accepted on chain, but payouts are clipped to 0.95.
  await fieldByLabel(page, 'Maximum').fill('0.98');
  await expect(
    page.getByText(
      'Nothing above 0.95 has any effect: the Treasury clips every payout there. Use 0.95.',
    ),
  ).toBeVisible();

  await fieldByLabel(page, 'Maximum').fill('0.95');
  await expect(page.getByText('Nothing above 0.95')).toHaveCount(0);
  await expect(
    page.getByText('0.95 is as high as this can go and still mean anything.'),
  ).toBeVisible();
});

test('the premium ladder reads back as it is set and derives where each band starts', async ({
  page,
}) => {
  await openPanel(page);

  await expect(page.getByText('0%–10% sell 0%')).toBeVisible();
  await expect(page.getByText('25%+ sell 1.5%')).toBeVisible();

  // Each floor is the previous ceiling, so it is derived.
  await expect(page.getByText('from 0%')).toBeVisible();
  await expect(page.getByText('from 10%')).toBeVisible();
  await expect(page.getByText('from 25%')).toBeVisible();
});

test('a band selling more than the contract permits is refused', async ({
  page,
}) => {
  await openPanel(page);

  // Wait for the table to seed from chain, or the limit is not known yet.
  const rates = page.getByLabel('sell per window');
  await expect(rates.first()).toHaveValue(/\d/);

  await rates.first().fill('9');
  await expect(
    page.getByText('The contract allows at most 5% per window'),
  ).toBeVisible();

  const ceilings = page.getByLabel('up to', { exact: false });
  await ceilings.nth(1).fill('5');
  await expect(
    page.getByText('Must be above 10%, where this band starts'),
  ).toBeVisible();
});

/** `retuneSeries` can only narrow a series. */
test('a retune states the bounds of the series it is retuning', async ({
  page,
}) => {
  await openPanel(page);

  await expect(
    page.getByText('A retune can only narrow a series:', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Can only come down. Between 100,000 STRAT already filled and the 1,000,000 STRAT it is set to now.',
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Can only get longer. At least the 180 days it is set to now.',
    ),
  ).toBeVisible();
});

test('the series id is an argument, so it shows no current value of its own', async ({
  page,
}) => {
  await openPanel(page);

  // Regression: the field used to preview a next-series hint as its value.
  const seriesId = fieldIn(page, RETUNE, 'Series');
  await seriesId.fill('0');
  await expect(page.getByText('none created yet')).toHaveCount(0);
  await expect(page.getByText('latest is')).toHaveCount(0);
});

test('a retune that would widen the series is refused before it costs gas', async ({
  page,
}) => {
  await openPanel(page);

  await fieldIn(page, RETUNE, 'Series').fill('0');

  // InvalidCapacity.
  const capacity = fieldIn(page, RETUNE, 'Capacity');
  await capacity.fill('2000000');
  await expect(
    page.getByText(
      'A retune can only lower it: at most the 1,000,000 STRAT it is set to now',
    ),
  ).toBeVisible();

  // Also InvalidCapacity.
  await capacity.fill('50000');
  await expect(
    page.getByText('Below the 100,000 STRAT already filled'),
  ).toBeVisible();

  await capacity.fill('500000');
  await expect(page.getByText('A retune can only lower it')).toHaveCount(0);
  await expect(page.getByText('Below the 100,000 STRAT')).toHaveCount(0);

  // InvalidVestingTerm.
  const term = fieldIn(page, RETUNE, 'Vesting term');
  await term.fill('1');
  await expect(
    page.getByText(
      'A retune can only lengthen it: at least the 180 days it is set to now',
    ),
  ).toBeVisible();

  await term.fill('365');
  await expect(page.getByText('A retune can only lengthen it')).toHaveCount(0);
});

test('a close time later than the current one is refused', async ({ page }) => {
  await openPanel(page);

  await fieldIn(page, RETUNE, 'Series').fill('0');
  // The bound depends on the runner timezone.
  await fieldIn(page, RETUNE, 'Closes').fill('2026-12-01T10:00');
  await expect(
    page.getByText('A retune can only bring it earlier: at the latest', {
      exact: false,
    }),
  ).toBeVisible();
});
