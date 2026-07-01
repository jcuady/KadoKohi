import { test, expect } from '@playwright/test';
import { customerLogin, internalLogin, trackPageErrors, uniqueTestId, clearSupabaseSession } from './helpers';

test.describe('Admin pastries', () => {
  test('admin can add a pastry with variant controls then remove it', async ({ page }) => {
    test.setTimeout(60_000);
    const errors = trackPageErrors(page);
    const pastryName = `E2E ${uniqueTestId('cookie')}`;

    page.on('dialog', (dialog) => dialog.accept());

    await internalLogin(page, 'admin');
    await page.goto('/admin/menu?tab=pastries');
    await expect(page.getByRole('heading', { name: /menu manager/i })).toBeVisible({ timeout: 20000 });

    const addPastryBtn = page.getByRole('button', { name: /add pastry/i }).first();
    await expect(addPastryBtn).toBeVisible({ timeout: 20000 });
    await addPastryBtn.click();

    const modal = page.locator('form').filter({ has: page.getByRole('heading', { name: /add pastry/i }) });
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/mix\s*&\s*match/i)).toHaveCount(0);
    await expect(modal.getByText('Size options', { exact: true })).toBeVisible();
    await expect(modal.getByText('Custom option groups', { exact: true })).toBeVisible();
    await modal.locator('input').first().fill(pastryName);
    await modal.getByRole('spinbutton').first().fill('120');
    await modal.getByRole('button', { name: /^create$/i }).click();
    await expect(page.getByText(pastryName)).toBeVisible({ timeout: 20000 });

    const productRow = page.locator('.rounded-xl.dash-card-alt').filter({ hasText: pastryName });
    await productRow.getByRole('button', { name: new RegExp(`Delete ${pastryName}`, 'i') }).click();
    await productRow.getByRole('button', { name: new RegExp(`Delete ${pastryName}`, 'i') }).click();
    await expect(page.getByText(pastryName)).toHaveCount(0, { timeout: 15000 });

    expect(errors(), 'no uncaught errors').toEqual([]);
  });
});

test.describe('Customer pastries', () => {
  test('pastries page loads without Mix & Match branding', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/pastries');
    await expect(page.getByRole('heading', { name: /pastries/i })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/mix\s*&\s*match/i)).toHaveCount(0);
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('signed-in customer can add a pastry created in admin', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = trackPageErrors(page);
    const pastryName = `E2E ${uniqueTestId('buy-cookie')}`;

    page.on('dialog', (dialog) => dialog.accept());

    await internalLogin(page, 'admin');
    await page.goto('/admin/menu?tab=pastries');
    await page.getByRole('button', { name: /add pastry/i }).first().click();
    const modal = page.locator('form').filter({ has: page.getByRole('heading', { name: /add pastry/i }) });
    await modal.locator('input').first().fill(pastryName);
    await modal.getByRole('spinbutton').first().fill('99');
    await modal.getByRole('button', { name: /^create$/i }).click();
    await expect(page.getByText(pastryName)).toBeVisible({ timeout: 20000 });

    await customerLogin(page);
    await page.goto('/pastries');

    const closedMsg = page.getByText(/online ordering is closed/i);
    if (await closedMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'Online order window is closed in local timezone');
    }

    await page.getByRole('button', { name: pastryName }).click({ timeout: 20000 });
    const addBtn = page.getByRole('button', { name: /^add —/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();
    await expect(page.getByText(/added!/i)).toBeVisible({ timeout: 10000 });

    await clearSupabaseSession(page);
    await internalLogin(page, 'admin');
    await page.goto('/admin/menu?tab=pastries', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/admin\/menu/, { timeout: 45000 });
    await expect(page.getByRole('heading', { name: /menu manager/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(pastryName)).toBeVisible({ timeout: 20000 });
    const productRow = page.locator('.rounded-xl.dash-card-alt').filter({ hasText: pastryName });
    await productRow.getByRole('button', { name: new RegExp(`Delete ${pastryName}`, 'i') }).click();
    await productRow.getByRole('button', { name: new RegExp(`Delete ${pastryName}`, 'i') }).click();

    expect(errors(), 'no uncaught errors').toEqual([]);
  });
});
