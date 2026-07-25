import { test, expect } from '@playwright/test';
import { internalLogin, trackPageErrors } from './helpers';

test.describe('Barista operational writes', () => {
  test('barista POS places a cash order and queue shows it', async ({ page }) => {
    const errors = trackPageErrors(page);
    await internalLogin(page, 'barista');
    await page.goto('/barista/pos');
    await expect(page.getByRole('heading', { name: /^POS$/i })).toBeVisible({ timeout: 20000 });

    const productBtn = page.locator('.grid.sm\\:grid-cols-2.gap-3 button').first();
    await expect(productBtn).toBeVisible({ timeout: 20000 });
    await productBtn.click();

    const modal = page.locator('.fixed.inset-0').filter({ hasText: /select variants/i });
    await expect(modal).toBeVisible({ timeout: 10000 });
    await modal.getByRole('button', { name: /^Add/i }).click();
    await expect(modal).toHaveCount(0, { timeout: 10000 });

    await page.getByRole('button', { name: /place order/i }).click();
    const placedBanner = page.getByText(/order .+ placed/i);
    await expect(placedBanner).toBeVisible({ timeout: 20000 });

    const bannerText = (await placedBanner.textContent()) ?? '';
    const shortCode = bannerText.match(/Order\s+(KK-\d+)/i)?.[1];
    expect(shortCode, 'expected short code in placement banner').toBeTruthy();

    await page.goto('/barista/queue');
    await expect(page.getByRole('heading', { name: /^queue$/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(shortCode!)).toBeVisible({ timeout: 20000 });

    // Open status modal and move the paid POS ticket into preparing.
    await page.getByRole('button', { name: new RegExp(shortCode!) }).first().click();
    const statusModal = page.locator('.fixed.inset-0').filter({ hasText: /update order/i });
    await expect(statusModal).toBeVisible({ timeout: 10000 });
    await statusModal.locator('select').first().selectOption('preparing');
    await statusModal.getByRole('button', { name: /^save$/i }).click();
    await expect(statusModal).toHaveCount(0, { timeout: 15000 });
    await expect(page.getByText(/preparing/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.fixed.bottom-4').filter({ hasText: /failed/i })).toHaveCount(0);

    expect(errors(), `uncaught errors: ${errors().join(' | ')}`).toEqual([]);
  });
});
