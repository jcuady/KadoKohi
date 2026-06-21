import { test, expect } from '@playwright/test';
import { internalLogin, trackPageErrors } from './helpers';

/**
 * Authenticated admin flow. Visits every admin route to catch render/runtime
 * crashes, and exercises the user + voucher modals (open → cancel, no writes).
 */

const ADMIN_ROUTES = [
  '/admin',
  '/admin/orders',
  '/admin/menu',
  '/admin/merch',
  '/admin/branches',
  '/admin/tables',
  '/admin/users',
  '/admin/vouchers',
  '/admin/loyalty',
  '/admin/stamps',
  '/admin/audit',
  '/admin/settings',
  '/admin/pos',
];

test('admin can sign in via the internal portal', async ({ page }) => {
  const errors = trackPageErrors(page);
  await internalLogin(page, 'admin');
  await expect(page.locator('#root')).not.toBeEmpty();
  expect(errors()).toEqual([]);
});

test('every admin route renders without uncaught errors', async ({ page }) => {
  const errors = trackPageErrors(page);
  await internalLogin(page, 'admin');
  for (const route of ADMIN_ROUTES) {
    await page.goto(route);
    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
  }
  expect(errors(), `uncaught errors: ${errors().join(' | ')}`).toEqual([]);
});

test('add-user modal opens, validates, and cancels cleanly', async ({ page }) => {
  await internalLogin(page, 'admin');
  await page.goto('/admin/users');
  await page.getByRole('button', { name: /add user/i }).click();
  await expect(page.getByRole('heading', { name: /new user/i })).toBeVisible();

  const modal = page.locator('form').filter({ has: page.getByRole('heading', { name: /new user/i }) });
  const roleSelect = modal.locator('select').first();

  // Choosing barista must surface the required branch selector.
  await roleSelect.selectOption('barista');
  await expect(modal.getByText(/^Branch/i)).toBeVisible();

  await roleSelect.selectOption('staff');
  await expect(modal.getByText(/^Branch/i)).toBeVisible();

  await page.getByRole('button', { name: /cancel/i }).click();
  await expect(page.getByRole('heading', { name: /new user/i })).toHaveCount(0);
});

test('voucher modal opens and percent value is capped at 100', async ({ page }) => {
  await internalLogin(page, 'admin');
  await page.goto('/admin/vouchers');
  await page.getByRole('button', { name: /new code/i }).click();
  await expect(page.getByRole('heading', { name: /new promo code/i })).toBeVisible();

  // Percent discount input must enforce a max of 100.
  const valueInput = page.locator('input[type="number"]').first();
  await expect(valueInput).toHaveAttribute('max', '100');

  await page.getByRole('button', { name: /cancel/i }).click();
  await expect(page.getByRole('heading', { name: /new promo code/i })).toHaveCount(0);
});
