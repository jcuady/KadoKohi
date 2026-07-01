import { test, expect } from '@playwright/test';
import { CREDS, dismissCookieConsent, fillCustomerSignIn, internalLogin, trackPageErrors } from './helpers';

test.describe('Internal portal route guards', () => {
  test('staff cannot access admin routes', async ({ page }) => {
    await internalLogin(page, 'staff');
    await page.goto('/admin/orders');
    await expect(page).toHaveURL(/\/management-portal/, { timeout: 15000 });
  });

  test('barista cannot access admin routes', async ({ page }) => {
    await internalLogin(page, 'barista');
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/management-portal/, { timeout: 15000 });
  });

  test('staff cannot access barista routes', async ({ page }) => {
    await internalLogin(page, 'staff');
    await page.goto('/barista/queue');
    await expect(page).toHaveURL(/\/management-portal/, { timeout: 15000 });
  });

  test('barista cannot access staff routes', async ({ page }) => {
    await internalLogin(page, 'barista');
    await page.goto('/staff/orders');
    await expect(page).toHaveURL(/\/management-portal/, { timeout: 15000 });
  });

  test('admin can access staff and barista portals', async ({ page }) => {
    const errors = trackPageErrors(page);
    await internalLogin(page, 'admin');
    await page.goto('/staff/orders');
    await expect(page.getByRole('heading', { name: /all orders/i })).toBeVisible({ timeout: 15000 });
    await page.goto('/barista');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
    expect(errors()).toEqual([]);
  });

  test('customer cannot access internal portals', async ({ page }) => {
    await page.goto('/auth/login');
    await dismissCookieConsent(page);
    await fillCustomerSignIn(page, CREDS.customer.email, CREDS.customer.password);
    await page.waitForURL(/\/account/, { timeout: 45000 });

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/management-portal/, { timeout: 15000 });

    await page.goto('/staff');
    await expect(page).toHaveURL(/\/management-portal/, { timeout: 15000 });

    await page.goto('/barista');
    await expect(page).toHaveURL(/\/management-portal/, { timeout: 15000 });
  });
});
