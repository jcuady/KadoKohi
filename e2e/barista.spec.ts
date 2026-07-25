import { test, expect } from '@playwright/test';
import { internalLogin, trackPageErrors } from './helpers';

/**
 * Authenticated barista flow. Visits the operational surfaces to catch
 * render/runtime crashes. Does not mutate orders.
 */

const BARISTA_ROUTES = [
  '/barista',
  '/barista/queue',
  '/barista/pos',
  '/barista/menu',
  '/barista/stamps',
  '/barista/kiosk',
  '/barista/settings',
];

test('barista can sign in via the internal portal', async ({ page }) => {
  const errors = trackPageErrors(page);
  await internalLogin(page, 'barista');
  await expect(page.locator('#root')).not.toBeEmpty();
  expect(errors()).toEqual([]);
});

test('every barista route renders without uncaught errors', async ({ page }) => {
  const errors = trackPageErrors(page);
  await internalLogin(page, 'barista');
  for (const route of BARISTA_ROUTES) {
    await page.goto(route);
    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
  }
  expect(errors(), `uncaught errors: ${errors().join(' | ')}`).toEqual([]);
});

test('barista can open account settings and change-password form', async ({ page }) => {
  const errors = trackPageErrors(page);
  await internalLogin(page, 'barista');
  await page.goto('/barista/settings');
  await expect(page.getByRole('heading', { name: /account settings/i })).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#dashboard-new-password')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: /change password/i })).toBeVisible();
  expect(errors()).toEqual([]);
});

test('barista kiosk display renders', async ({ page }) => {
  const errors = trackPageErrors(page);
  await internalLogin(page, 'barista');
  await page.goto('/barista/kiosk');
  await expect(page.locator('#root')).not.toBeEmpty();
  expect(errors()).toEqual([]);
});
