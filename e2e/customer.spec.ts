import { test, expect } from '@playwright/test';
import {
  CREDS,
  customerLogin,
  trackPageErrors,
  expectNoHorizontalOverflow,
} from './helpers';

/**
 * Authenticated customer flow. Read-only: navigates the account area and
 * exercises client-side validation. Does not place orders.
 */

test('customer can sign in and see the account dashboard', async ({ page }) => {
  const errors = trackPageErrors(page);
  await customerLogin(page);
  await expect(page.locator('#root')).not.toBeEmpty();
  expect(errors(), 'no uncaught errors after login').toEqual([]);
});

test('account sub-pages load without runtime errors', async ({ page }) => {
  const errors = trackPageErrors(page);
  await customerLogin(page);
  for (const path of ['/account/orders', '/account/vouchers', '/account/profile']) {
    await page.goto(path);
    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(page).toHaveURL(new RegExp(path));
  }
  expect(errors(), 'no uncaught errors across account pages').toEqual([]);
});

test('profile password change validates mismatch client-side', async ({ page }) => {
  await customerLogin(page);
  await page.goto('/account/profile');
  await expect(page.getByRole('heading', { name: /^profile$/i })).toBeVisible({ timeout: 20000 });

  await page.locator('#customer-current-password').fill(CREDS.customer.password);
  await page.locator('#customer-new-password').fill('newpassword123');
  await page.locator('#customer-confirm-password').fill('newpassword456');
  await page.getByRole('button', { name: /change password/i }).click();
  await expect(page.getByText(/passwords do not match/i)).toBeVisible();
});

test('profile edit reveals an editable name field', async ({ page }) => {
  await customerLogin(page);
  await page.goto('/account/profile');
  await page.getByRole('button', { name: /^edit$/i }).click({ timeout: 20000 });
  await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
  // Email stays locked (login credential).
  await expect(page.locator('input[type="email"]')).toBeDisabled();
});

test('account dashboard has no horizontal overflow on mobile', async ({ page }) => {
  await customerLogin(page);
  await expectNoHorizontalOverflow(page);
});
