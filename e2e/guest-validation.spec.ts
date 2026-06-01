import { test, expect } from '@playwright/test';
import { trackPageErrors } from './helpers';

test('takeout shows error when placing without a pickup name', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/order/takeout');
  await expect(page.getByText(/grab & go/i)).toBeVisible({ timeout: 20000 });

  const placeBtn = page.getByRole('button', { name: /place takeout order/i });
  await expect(placeBtn).toBeDisabled();

  await page.getByPlaceholder(/e\.g\. juan/i).fill('   ');
  await expect(placeBtn).toBeDisabled();

  expect(errors(), 'no uncaught errors').toEqual([]);
});
