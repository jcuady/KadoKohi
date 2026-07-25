import { test, expect } from '@playwright/test';
import { trackPageErrors, expectNoHorizontalOverflow } from './helpers';

/**
 * Guest ordering surfaces (dine-in QR + takeout). These render the standalone
 * order pages without the marketing chrome and read the menu via the anon role.
 * No orders are placed.
 */

test('QR page shows a clear "Table not found" for an unknown code', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/order/qr/zzz-does-not-exist');
  await expect(page.getByText(/table not found/i)).toBeVisible({ timeout: 20000 });
  expect(errors(), 'no uncaught errors').toEqual([]);
});

test('Takeout page renders the ordering UI and gates the place button', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/order/takeout');

  // Branded header + empty-cart place gate (guest name appears after items are added).
  await expect(page.getByText(/grab & go/i)).toBeVisible({ timeout: 20000 });

  const placeBtn = page.getByRole('button', { name: /place takeout order/i });
  await expect(placeBtn).toBeVisible();
  await expect(placeBtn).toBeDisabled();

  expect(errors(), 'no uncaught errors').toEqual([]);
});

test('Takeout page has no horizontal overflow', async ({ page }) => {
  await page.goto('/order/takeout');
  await expect(page.getByText(/grab & go/i)).toBeVisible({ timeout: 20000 });
  await expectNoHorizontalOverflow(page);
});
