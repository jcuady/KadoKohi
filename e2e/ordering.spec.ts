import { test, expect } from '@playwright/test';
import {
  addFirstGuestMenuItem,
  clearSupabaseSession,
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

  test('legacy /order redirects to /menu (cart is the online surface)', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/order');
    await page.waitForURL(/\/menu/, { timeout: 15000 });
    await dismissCookieConsent(page);
    await expect(page.getByRole('heading', { name: /menu|our drinks|order/i }).first()).toBeVisible({
      timeout: 25000,
    });
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('online guest cannot place from cart without a name', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/menu');
    await clearSupabaseSession(page);
    await page.reload();
    await dismissCookieConsent(page);

    const closedMsg = page.getByText(/online ordering is closed/i);
    if (await closedMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'Online order window is closed in local timezone');
    }

    const card = page.getByRole('button', { name: /latte|matcha|americano|kado/i }).first();
    await expect(card).toBeVisible({ timeout: 25000 });
    await card.click();
    const addBtn = page.getByRole('button', { name: /^add —/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const cartToggle = page.getByRole('button', { name: /^Cart — \d+ items$/i });
    const cartOpen = await page.getByRole('button', { name: /close cart/i }).isVisible().catch(() => false);
    if (!cartOpen) await cartToggle.click();

    // Guest GCash path requires a pickup name before Place Order enables.
    await page.getByRole('button', { name: /gcash qr/i }).click();
    await expect(page.getByPlaceholder(/your name/i)).toBeVisible();
    const placeBtn = page.getByRole('button', { name: /^place order$/i });
    await expect(placeBtn).toBeVisible({ timeout: 10000 });
    await expect(placeBtn).toBeDisabled();
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('takeout enables place after cart item then name', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/order/takeout');
    await dismissCookieConsent(page);
    await expect(page.getByText(/grab & go/i)).toBeVisible({ timeout: 25000 });

    const placeBtn = page.getByRole('button', { name: /place takeout order/i });
    await expect(placeBtn).toBeDisabled();

    // Name field is gated until the bag has items.
    await addFirstGuestMenuItem(page);
    await page.getByRole('button', { name: /review cart/i }).click();
    await page.getByPlaceholder(/e\.g\. juan/i).fill('E2E Guest');
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
