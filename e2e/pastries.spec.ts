import { test, expect } from '@playwright/test';
import {
  clearSupabaseSession,
  customerLogin,
  internalLogin,
  supabaseGet,
  trackPageErrors,
  uniqueTestId,
} from './helpers';

test.describe('Admin pastries', () => {
  test('admin can add a pastry with variant controls then remove it', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = trackPageErrors(page);
    const pastryName = `E2E ${uniqueTestId('cookie')}`;

    page.on('dialog', (dialog) => dialog.accept());

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
    await deleteProduct.click();
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
    await expect(page.getByText(/mix\s*&\s*match/i)).toHaveCount(0);
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('customer can build a 4-pc kuki box with per-cookie quantities', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = trackPageErrors(page);
    await page.goto('/pastries');
    await expect(page.getByRole('button', { name: /kuki boxes/i }).first()).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: /kuki boxes/i }).first().click();
    const dialog = page.getByRole('dialog', { name: /kuki boxes/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /4 pcs/i }).click();
    // Fill 4 slots via first cookie + buttons
    const firstPlus = dialog.getByRole('button', { name: /add one/i }).first();
    for (let i = 0; i < 4; i++) {
      await firstPlus.click();
    }
    await expect(dialog.getByText(/box full/i)).toBeVisible();
    await dialog.getByRole('button', { name: /add 4-pc box/i }).click();
    await expect(dialog).toHaveCount(0, { timeout: 5000 });
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('signed-in customer can add a pastry created in admin', async ({ page, request }) => {
    test.setTimeout(120_000);
    const errors = trackPageErrors(page);
    const pastryName = `E2E ${uniqueTestId('buy-cookie')}`;

    page.on('dialog', (dialog) => dialog.accept());

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
    await deleteProduct.click();

    expect(errors(), 'no uncaught errors').toEqual([]);
  });
});
