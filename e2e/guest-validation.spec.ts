import { test, expect } from '@playwright/test';
import {
  addFirstGuestMenuItem,
  fetchActiveBranchSlug,
  trackPageErrors,
} from './helpers';

test('takeout shows error when placing without a pickup name', async ({ page, request }) => {
  const errors = trackPageErrors(page);
  const slug = await fetchActiveBranchSlug(request);
  test.skip(!slug, 'Need an active branch slug');

  await page.goto(`/order/takeout?b=${slug}`);
  await expect(page.getByText(/grab & go/i)).toBeVisible({ timeout: 20000 });

  await addFirstGuestMenuItem(page);
  await page.getByRole('button', { name: /review cart/i }).click();

  const placeBtn = page.getByRole('button', { name: /place takeout order/i });
  await expect(placeBtn).toBeDisabled();

  await page.getByPlaceholder(/e\.g\. juan/i).fill('   ');
  await expect(placeBtn).toBeDisabled();

  await page.getByPlaceholder(/e\.g\. juan/i).fill('Juan');
  await expect(placeBtn).toBeEnabled();

  expect(errors(), 'no uncaught errors').toEqual([]);
});
