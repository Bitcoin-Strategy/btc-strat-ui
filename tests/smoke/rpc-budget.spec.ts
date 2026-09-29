import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

/** Caps HTTP requests to the shared public RPC, so a new fast poll fails here. */

const countRpc = (page: Page) => {
  const seen: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (
      request.method() === 'POST' &&
      (url.hostname.includes('robinhood') ||
        url.hostname.includes('publicnode'))
    ) {
      seen.push(request.postData() ?? '');
    }
  });
  return seen;
};

const reads = (bodies: readonly string[]) =>
  bodies.filter((body) => body.includes('eth_call'));

test('a page load costs a handful of requests, not one per read', async ({
  page,
}) => {
  const requests = countRpc(page);
  await page.goto('/');
  await expect(
    page.getByText('Market (USD / STRAT)', { exact: true }),
  ).toBeVisible();

  expect(requests.length).toBeLessThanOrEqual(8);
});

test('an idle page does not poll the endpoint', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByText('Market (USD / STRAT)', { exact: true }),
  ).toBeVisible();

  const requests = countRpc(page);
  await page.waitForTimeout(12_000);

  // Nothing polls faster than two minutes.
  expect(requests.length).toBe(0);
});

test('moving between pages and back does not re-read what is still fresh', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByText('Market (USD / STRAT)', { exact: true }),
  ).toBeVisible();

  // Follow links: a full reload would drop the cache under test.
  await page.getByRole('link', { name: 'Governance' }).click();
  await expect(page.getByText('Parameters track')).toBeVisible();

  // The proposal scan lands after the page draws.
  await page.waitForTimeout(1_500);

  const requests = countRpc(page);

  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(
    page.getByText('Market (USD / STRAT)', { exact: true }),
  ).toBeVisible();

  // Still within `staleTime`, so nothing is re-read.
  expect(reads(requests)).toEqual([]);
  expect(requests).toEqual([]);
});

test('a second visit to governance does not rescan the chain for proposals', async ({
  page,
}) => {
  await page.goto('/governance');
  await expect(
    page.getByRole('heading', { name: 'Governance', exact: true }),
  ).toBeVisible();

  const logQueries: number[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'POST') return;
    const body = request.postData() ?? '';
    if (body.includes('eth_getLogs')) logQueries.push(1);
  });

  await page.goto('/bonding');
  await page.goto('/governance');
  await expect(
    page.getByRole('heading', { name: 'Governance', exact: true }),
  ).toBeVisible();

  // Cached logs: the scan resumes from the last cursor.
  expect(logQueries.length).toBeLessThanOrEqual(2);
});
