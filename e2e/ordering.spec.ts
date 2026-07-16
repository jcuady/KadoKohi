import { test, expect } from '@playwright/test';
import {
  addFirstGuestMenuItem,
  dismissCookieConsent,
  fetchActiveBranchSlug,
  fetchActiveTableCode,
  supabaseAnonConfig,
  trackPageErrors,
} from './helpers';

test.describe('Guest ordering surfaces', () => {
  test('valid QR code loads dine-in menu for the table', async ({ page, request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');

    const code = await fetchActiveTableCode(request);
    test.skip(!code, 'No active table in seed data');

    const errors = trackPageErrors(page);
    await page.goto(`/order/qr/${encodeURIComponent(code)}`);
    await expect(page.getByText(/dine-in ·/i)).toBeVisible({ timeout: 25000 });
    await expect(page.getByRole('heading', { name: /order from your table/i })).toBeVisible();
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('takeout with branch slug shows branch in header', async ({ page, request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');

    const slug = await fetchActiveBranchSlug(request);
    test.skip(!slug, 'No active branch in seed data');

    const errors = trackPageErrors(page);
    await page.goto(`/order/takeout?b=${encodeURIComponent(slug)}`);
    await expect(page.getByText(/grab & go/i)).toBeVisible({ timeout: 25000 });
    await expect(page.getByText(new RegExp(`takeout ·`, 'i'))).toBeVisible();
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('takeout rejects unknown branch slug', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/order/takeout?b=zzz-not-a-real-branch');
    await expect(page.getByText(/no active branch matches/i)).toBeVisible({ timeout: 20000 });
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('online order page renders menu and pickup branch selector', async ({ page }, testInfo) => {
    const errors = trackPageErrors(page);
    await page.goto('/order');
    await dismissCookieConsent(page);
    await expect(page.getByRole('heading', { name: /place an order/i })).toBeVisible({
      timeout: 25000,
    });
    await expect(page.locator('.guest-order-product-grid').first()).toBeVisible();
    // Guest name + branch live in the desktop cart sidebar (mobile cart is collapsed until items are added).
    if (testInfo.project.name === 'desktop-chrome') {
      await expect(page.getByLabel(/pickup branch/i)).toBeVisible();
      await expect(page.getByLabel(/your name \(guest\)/i)).toBeVisible();
    }
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('online guest must enter a name before placing', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/order');
    await dismissCookieConsent(page);
    await expect(page.locator('.guest-order-product-grid').first()).toBeVisible({ timeout: 25000 });

    const grid = page.locator('.guest-order-product-grid button:not([disabled])').first();
    await grid.click();

    const placeBtn = page.getByRole('button', { name: /place order/i }).locator('visible=true').first();
    await expect(placeBtn).toBeEnabled();
    await placeBtn.click();

    await expect(
      page.getByText(/please enter your name for pickup/i).locator('visible=true').first(),
    ).toBeVisible();
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('takeout enables place after name and cart item', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/order/takeout');
    await expect(page.getByText(/grab & go/i)).toBeVisible({ timeout: 25000 });

    const placeBtn = page.getByRole('button', { name: /place takeout order/i });
    await expect(placeBtn).toBeDisabled();

    await page.getByPlaceholder(/e\.g\. juan/i).fill('E2E Guest');
    await addFirstGuestMenuItem(page);

    // Sticky cart collapses place CTA until guest reviews the bag.
    await page.getByRole('button', { name: /review cart/i }).click();
    await expect(placeBtn).toBeEnabled();
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('takeout and QR menus do not show Mix & Match tab', async ({ page, request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');

    const code = await fetchActiveTableCode(request);
    test.skip(!code, 'No active table in seed data');

    await page.goto('/order/takeout');
    await expect(page.getByText(/grab & go/i)).toBeVisible({ timeout: 25000 });
    await expect(page.getByRole('button', { name: /mix\s*&\s*match/i })).toHaveCount(0);
    await expect(page.getByText(/mix\s*&\s*match/i)).toHaveCount(0);

    await page.goto(`/order/qr/${encodeURIComponent(code)}`);
    await expect(page.getByText(/dine-in ·/i)).toBeVisible({ timeout: 25000 });
    await expect(page.getByRole('button', { name: /mix\s*&\s*match/i })).toHaveCount(0);
    await expect(page.getByText(/mix\s*&\s*match/i)).toHaveCount(0);
  });
});
