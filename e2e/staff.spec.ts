import { test, expect } from '@playwright/test';
import { internalLogin, trackPageErrors } from './helpers';

const STAFF_ROUTES = [
  '/staff',
  '/staff/merch-orders',
  '/staff/booth-bookings',
  '/staff/orders',
  '/staff/settings',
];

test.describe('staff portal', () => {
  test('staff can sign in via the internal portal', async ({ page }) => {
    const errors = trackPageErrors(page);
    await internalLogin(page, 'staff');
    await expect(page.locator('#root')).not.toBeEmpty();
    expect(errors()).toEqual([]);
  });

  test('every staff route renders without uncaught errors', async ({ page }) => {
    const errors = trackPageErrors(page);
    await internalLogin(page, 'staff');
    for (const route of STAFF_ROUTES) {
      await page.goto(route);
      await expect(page.locator('#root')).not.toBeEmpty();
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    }
    expect(errors(), `uncaught errors: ${errors().join(' | ')}`).toEqual([]);
  });
});
