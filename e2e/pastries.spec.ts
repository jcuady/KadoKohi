import { test, expect, type Page } from '@playwright/test';
import {
  clearSupabaseSession,
  customerLogin,
  dismissCookieConsent,
  fetchActiveBranchSlug,
  fetchActiveTableCode,
  internalLogin,
  supabaseGet,
  trackPageErrors,
  uniqueTestId,
} from './helpers';

/** Admin destructive confirm uses in-app ConfirmDialog (not window.confirm). */
async function confirmAdminDelete(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog').filter({ hasText: /delete/i });
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await dialog.getByRole('button', { name: /^delete$/i }).click();
  await expect(dialog).toHaveCount(0, { timeout: 15000 });
}

test.describe('Admin pastries', () => {
  test('admin can add a pastry with variant controls then remove it', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = trackPageErrors(page);
    const pastryName = `E2E ${uniqueTestId('cookie')}`;

    await internalLogin(page, 'admin');
    await page.goto('/admin/menu?tab=pastries');
    await expect(page.getByRole('heading', { name: /^menu$/i })).toBeVisible({ timeout: 20000 });

    const addPastryBtn = page.getByRole('button', { name: /add pastry/i }).first();
    await expect(addPastryBtn).toBeVisible({ timeout: 20000 });
    await addPastryBtn.click();

    const modal = page.locator('form').filter({ has: page.getByRole('heading', { name: /add pastry/i }) });
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/mix\s*&\s*match/i)).toHaveCount(0);
    await expect(modal.getByText('Size options', { exact: true })).toBeVisible();
    await expect(modal.getByText('Custom option groups', { exact: true })).toBeVisible();
    await modal.getByPlaceholder(/red velvet cookie/i).fill(pastryName);
    await modal.locator('input[type="number"]').first().fill('120');
    await modal.getByRole('button', { name: /^create$/i }).click();
    await expect(modal).toHaveCount(0, { timeout: 20000 });
    await expect(page.getByText(pastryName)).toBeVisible({ timeout: 20000 });

    const deleteProduct = page.getByRole('button', { name: new RegExp(`Delete ${pastryName}`, 'i') });
    await deleteProduct.click();
    await confirmAdminDelete(page);
    await expect(page.getByText(pastryName)).toHaveCount(0, { timeout: 15000 });

    expect(errors(), 'no uncaught errors').toEqual([]);
  });
});

test.describe('Customer pastries', () => {
  test('pastries page shows kukidō cookie menu chrome', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/pastries');
    await expect(page.getByRole('heading', { name: /cookie\s+menu/i })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: /kuki boxes/i }).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: /^kuki boxes$/i })).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#kuki-boxes img').first()).toBeVisible();
    // Transparent cutouts — cards must not sit on a black image plate
    await expect(page.locator('img[src*="klassic-cut"]').first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/mix\s*&\s*match/i)).toHaveCount(0);
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('customer can fill every kuki box size with cookie flavors', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = trackPageErrors(page);
    await page.goto('/pastries');
    await expect(page.getByRole('heading', { name: /^kuki boxes$/i })).toBeVisible({ timeout: 20000 });
    await page.locator('#kuki-boxes').getByRole('button', { name: /build a kuki box/i }).click();
    const dialog = page.getByRole('dialog', { name: /kuki boxes/i });
    await expect(dialog).toBeVisible();

    for (const size of [4, 5, 6, 10] as const) {
      await dialog.getByRole('button', { name: new RegExp(`^${size} pcs`) }).click();
      const firstPlus = dialog.getByRole('button', { name: /add one/i }).first();
      await expect(dialog.getByText(new RegExp(`cookie flavors · \\d+/${size}`, 'i'))).toBeVisible();
      for (let i = 0; i < size; i++) {
        if (await dialog.getByText(/box full/i).isVisible().catch(() => false)) break;
        await firstPlus.click();
      }
      await expect(dialog.getByText(/box full/i)).toBeVisible();
      await expect(dialog.getByRole('button', { name: new RegExp(`add ${size}-pc box`, 'i') })).toBeEnabled();
    }

    await dialog.getByRole('button', { name: /add 10-pc box/i }).click();
    await expect(dialog).toHaveCount(0, { timeout: 5000 });
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('menu 10-pc kuki box opens the flavor builder, not a drink drawer', async ({ page }) => {
    test.setTimeout(60_000);
    const errors = trackPageErrors(page);
    await page.goto('/menu');
    await expect(page.getByRole('heading', { name: /our menu/i })).toBeVisible({ timeout: 20000 });
    await page.locator('#catalog-search').fill('kuki box 10');
    const card = page.getByRole('button', { name: /kuki box.*10/i }).first();
    await expect(card).toBeVisible({ timeout: 20000 });
    await card.click();
    const dialog = page.getByRole('dialog', { name: /kuki boxes/i });
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText(/cookie flavors/i)).toBeVisible();
    await expect(dialog.getByRole('button', { name: /add one/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^add —/i })).toHaveCount(0);
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('signed-in customer can add a pastry created in admin', async ({ page, request }) => {
    test.setTimeout(120_000);
    const errors = trackPageErrors(page);
    const pastryName = `E2E ${uniqueTestId('buy-cookie')}`;

    await internalLogin(page, 'admin');
    await page.goto('/admin/menu?tab=pastries');
    await page.getByRole('button', { name: /add pastry/i }).first().click();
    const modal = page.locator('form').filter({ has: page.getByRole('heading', { name: /add pastry/i }) });
    await modal.getByPlaceholder(/red velvet cookie/i).fill(pastryName);
    await modal.locator('input[type="number"]').first().fill('99');
    await modal.getByRole('button', { name: /^create$/i }).click();
    await expect(modal).toHaveCount(0, { timeout: 20000 });
    await expect(page.getByText(pastryName)).toBeVisible({ timeout: 20000 });

    // Wait until public catalog can see the pastry (remote write + anon read).
    await expect
      .poll(
        async () => {
          const rows = await supabaseGet<{ id: string; name: string }[]>(
            request,
            `kk_products?select=id,name&name=eq.${encodeURIComponent(pastryName)}&visible=eq.true&limit=1`,
          );
          return rows?.length ?? 0;
        },
        { timeout: 30000 },
      )
      .toBeGreaterThan(0);

    await customerLogin(page);
    await page.goto('/pastries');
    await dismissCookieConsent(page);

    const closedMsg = page.getByText(/online ordering is closed/i);
    if (await closedMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'Online order window is closed in local timezone');
    }

    // Catalog is paginated — search so the new item is not stuck on a later page.
    await page.locator('#catalog-search').fill(pastryName);

    const pastryBtn = page.getByRole('button', {
      name: new RegExp(pastryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    });
    await expect(pastryBtn).toBeVisible({ timeout: 30000 });
    await pastryBtn.click();
    const addBtn = page.getByRole('button', { name: /^add —/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await dismissCookieConsent(page);
    await addBtn.click();
    await expect(page.getByText(/added!/i)).toBeVisible({ timeout: 10000 });

    await clearSupabaseSession(page);
    await internalLogin(page, 'admin');
    await page.goto('/admin/menu?tab=pastries', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/admin\/menu/, { timeout: 45000 });
    await expect(page.getByRole('heading', { name: /^menu$/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(pastryName)).toBeVisible({ timeout: 20000 });
    const deleteProduct = page.getByRole('button', { name: new RegExp(`Delete ${pastryName}`, 'i') });
    await deleteProduct.click();
    await confirmAdminDelete(page);
    await expect(page.getByText(pastryName)).toHaveCount(0, { timeout: 15000 });

    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('takeout guest can place a pastry pay-at-store order', async ({ page, request }) => {
    test.setTimeout(120_000);
    const errors = trackPageErrors(page);
    const slug = await fetchActiveBranchSlug(request);
    test.skip(!slug, 'No active branch');

    await page.goto(`/order/takeout?b=${encodeURIComponent(slug!)}`);
    await dismissCookieConsent(page);
    await expect(page.getByText(/grab & go/i)).toBeVisible({ timeout: 25000 });

    const pastriesTab = page.getByRole('button', { name: /^pastries$/i }).first();
    await expect(pastriesTab).toBeVisible({ timeout: 15000 });
    await pastriesTab.click();

    // Only one Pastries pill after duplicate-category fix.
    await expect(page.getByRole('button', { name: /^pastries$/i })).toHaveCount(1);
    await dismissCookieConsent(page);

    const grid = page.locator('#qr-cat-cat_pastries .guest-order-product-grid');
    await expect(grid).toBeVisible({ timeout: 20000 });
    const cookieBtn = grid.getByRole('button').filter({ hasText: /Klassic|Campfire|Blondie|Birthday|Walnut|Dark/i }).first();
    await expect(cookieBtn).toBeVisible({ timeout: 20000 });
    await cookieBtn.click();

    const sheet = page.locator('div.fixed.inset-x-0.bottom-0').filter({ hasText: 'Customize' }).last();
    await expect(sheet.getByText('Customize')).toBeVisible({ timeout: 8000 });
    await dismissCookieConsent(page);
    await sheet.getByRole('button', { name: /add to (order|table order)/i }).click();
    await expect(page.getByText('Customize')).toHaveCount(0, { timeout: 8000 });

    await page.getByRole('button', { name: /review cart/i }).click();
    await page.getByPlaceholder(/e\.g\. juan/i).fill('E2E Pastry Guest');
    // Payment tiles: "Cash" + hint "Pay at the counter"
    await page.getByRole('button', { name: /pay at the counter/i }).click();

    const placeBtn = page.getByRole('button', { name: /place takeout order/i });
    await expect(placeBtn).toBeEnabled({ timeout: 10000 });
    await placeBtn.click();

    await page.waitForURL(/\/checkout\//, { timeout: 30000 });
    await expect(page.getByText(/cash|pay at|order|total/i).first()).toBeVisible({ timeout: 15000 });
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('dine-in QR pastries tab exposes kuki boxes CTA', async ({ page, request }) => {
    const cfgErrors = trackPageErrors(page);
    const code = await fetchActiveTableCode(request);
    test.skip(!code, 'No active table');

    await page.goto(`/order/qr/${encodeURIComponent(code!)}`);
    await dismissCookieConsent(page);
    await expect(page.getByText(/dine-in ·/i)).toBeVisible({ timeout: 25000 });

    const pastriesTab = page.getByRole('button', { name: /^pastries$/i }).first();
    await expect(pastriesTab).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /^pastries$/i })).toHaveCount(1);
    await pastriesTab.click();
    await dismissCookieConsent(page);
    await expect(page.getByRole('button', { name: /build a kuki box/i }).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: /kuki box.*10/i }).first()).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole('button', { name: /build a kuki box/i }).first().click();
    const dialog = page.getByRole('dialog', { name: /kuki boxes/i });
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await dialog.getByRole('button', { name: /^10 pcs/ }).click();
    await expect(dialog.getByText(/cookie flavors · 0\/10/i)).toBeVisible();
    expect(cfgErrors(), 'no uncaught errors').toEqual([]);
  });
});
