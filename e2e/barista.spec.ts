import { test, expect } from '@playwright/test';
import { internalLogin, trackPageErrors } from './helpers';

/**
 * Authenticated barista flow. Visits the operational surfaces to catch
 * render/runtime crashes. Does not mutate orders.
 */

const BARISTA_ROUTES = ['/barista', '/barista/queue', '/barista/pos', '/barista/menu', '/barista/stamps'];

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

test('barista kiosk display renders', async ({ page }) => {
  const errors = trackPageErrors(page);
  await internalLogin(page, 'barista');
  await page.goto('/barista/kiosk');
  await expect(page.locator('#root')).not.toBeEmpty();
  expect(errors()).toEqual([]);
});
