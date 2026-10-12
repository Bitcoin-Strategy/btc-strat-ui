import { expect, test } from './fixtures';

import { SUBGRAPH } from '../../src/config';

test('chart labels, colours and tooltip agree about NAV and market price', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(
    page.getByText('Market (USD / STRAT)', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('NAV (USD / STRAT)', { exact: true }),
  ).toBeVisible();
  const chartCard = page
    .getByRole('heading', { name: 'Backing and market price' })
    .locator('..')
    .locator('..');
  await expect(chartCard.getByText('NAV (BTC)', { exact: true })).toHaveCount(
    0,
  );
  const market = page.locator('.recharts-area-dot[stroke="#10B981"]');
  const nav = page.locator('.recharts-area-dot[stroke="#F7931A"]');
  await expect(market).toHaveCount(3);
  await expect(nav).toHaveCount(3);
  await nav.first().hover({ force: true });
  const tooltip = page.locator('.recharts-tooltip-wrapper');
  await expect(tooltip).toContainText('UTC');
  await expect(
    tooltip.getByText('NAV:').locator('..').locator('..'),
  ).toContainText('6.0000000 USD');
  await expect(
    tooltip.getByText('Market:').locator('..').locator('..'),
  ).toContainText('7.2000000 USD');
  await expect(
    page.getByText(/Separate scales\. 3 Treasury snapshots/),
  ).toBeVisible();
  await page
    .getByRole('heading', { name: 'Backing and market price' })
    .locator('..')
    .locator('..')
    .evaluate((card) =>
      window.scrollBy(0, card.getBoundingClientRect().top - 80),
    );
  await page
    .getByRole('heading', { name: 'Backing and market price' })
    .locator('..')
    .locator('..')
    .screenshot({ path: testInfo.outputPath('chart.png') });
});

test('chart switches both axes and tooltip to BTC when the dollar feed is stale', async ({
  page,
}) => {
  await page.clock.setFixedTime(Date.now() + 24 * 60 * 60 * 1000);
  await page.goto('/');
  await expect(
    page.getByText('Market (BTC / STRAT)', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('NAV (BTC / STRAT)', { exact: true }),
  ).toBeVisible();
  await page
    .locator('.recharts-area-dot[stroke="#F7931A"]')
    .first()
    .hover({ force: true });
  const tooltip = page.locator('.recharts-tooltip-wrapper');
  await expect(tooltip).toContainText('0.00010000000 BTC');
  await expect(tooltip).toContainText('0.00012000000 BTC');
  await expect(tooltip).not.toContainText('USD');
  await expect(
    page.getByText(/USD values use the current BTC\/USD rate/),
  ).toHaveCount(0);
});

test('sparse history preserves elapsed time and does not invent missing market quotes', async ({
  page,
}) => {
  await page.route(SUBGRAPH.url, (route) =>
    route.fulfill({
      json: {
        data: {
          navPoints: [0, 3600, 36000].map((offset, i) => ({
            id: String(i),
            timestamp: String(1_790_000_000 + offset),
            blockNumber: String(123_000_000 + i),
            treasuryBtc: '100000000',
            stratTotalSupply: '10000000000000000000000',
            navBtcPerStratWad: '100000000000000',
            marketBtcPerStratWad: i === 1 ? null : '120000000000000',
            premiumBps: i === 1 ? null : 2000,
          })),
        },
      },
    }),
  );
  await page.goto('/');
  const nav = page.locator('.recharts-area-dot[stroke="#F7931A"]');
  const market = page.locator('.recharts-area-dot[stroke="#10B981"]');
  await expect(nav).toHaveCount(3);
  await expect(market).toHaveCount(2);
  const x = await nav.evaluateAll((dots) =>
    dots.map((dot) => Number(dot.getAttribute('cx'))),
  );
  expect((x[1] - x[0]) / (x[2] - x[0])).toBeCloseTo(0.1, 2);
  await nav.nth(1).hover({ force: true });
  const tooltip = page.locator('.recharts-tooltip-wrapper');
  await expect(tooltip).toContainText('Unavailable');
  await expect(tooltip).toContainText('6.0000000 USD');
});
