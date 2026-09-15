import { expect, setReads, test } from './fixtures';

/** The banner follows the pool hook state, so it must disappear once the pool opens. */
const NOTICE = 'Genesis auction on the way';

const NO_POOL = [0, 0, 0];

test('before the pool exists, every page says why the protocol is quiet', async ({
  page,
}) => {
  setReads(page, { observationState: NO_POOL });

  for (const route of ['/', '/bonding', '/redemption']) {
    await page.goto(route);
    await expect(page.getByText(NOTICE)).toBeVisible();
  }

  await expect(
    page.getByText('STRAT has not been distributed yet', { exact: false }),
  ).toBeVisible();

  await expect(page.getByRole('link', { name: /Learn more/ })).toHaveAttribute(
    'href',
    'https://btc-strategy.org',
  );
});

test('it can be dismissed, and stays dismissed across a reload', async ({
  page,
}) => {
  setReads(page, { observationState: NO_POOL });
  await page.goto('/');

  await expect(page.getByText(NOTICE)).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await expect(page.getByText(NOTICE)).toHaveCount(0);

  await page.reload();
  await expect(page.getByText(NOTICE)).toHaveCount(0);
});

test('once the pool is open the notice is gone, with nobody removing it', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByText(NOTICE)).toHaveCount(0);
});
