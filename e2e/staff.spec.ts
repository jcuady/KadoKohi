import { test, expect } from '@playwright/test';
import { internalLogin, trackPageErrors } from './helpers';

/**
 * Staff portal — requires a staff account in Supabase (create via Admin → Users).
 * Set STAFF_E2E_EMAIL and STAFF_E2E_PASSWORD in the environment to run these tests.
 */

const STAFF_EMAIL = process.env.STAFF_E2E_EMAIL;
const STAFF_PASSWORD = process.env.STAFF_E2E_PASSWORD;
const hasStaffCreds = Boolean(STAFF_EMAIL && STAFF_PASSWORD);

const STAFF_ROUTES = [
  '/staff',
  '/staff/merch-orders',
  '/staff/booth-bookings',
  '/staff/orders',
  '/staff/settings',
];

test.describe('staff portal', () => {
  test.skip(!hasStaffCreds, 'Set STAFF_E2E_EMAIL and STAFF_E2E_PASSWORD to run staff e2e');

  test('staff can sign in via the internal portal', async ({ page }) => {
    const errors = trackPageErrors(page);
    await internalLogin(page, 'staff', {
      email: STAFF_EMAIL!,
      password: STAFF_PASSWORD!,
    });
    await expect(page.locator('#root')).not.toBeEmpty();
    expect(errors()).toEqual([]);
  });

  test('every staff route renders without uncaught errors', async ({ page }) => {
    const errors = trackPageErrors(page);
    await internalLogin(page, 'staff', {
      email: STAFF_EMAIL!,
      password: STAFF_PASSWORD!,
    });
    for (const route of STAFF_ROUTES) {
      await page.goto(route);
      await expect(page.locator('#root')).not.toBeEmpty();
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    }
    expect(errors(), `uncaught errors: ${errors().join(' | ')}`).toEqual([]);
  });
});
