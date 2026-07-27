import { test, expect } from '@playwright/test';
import { internalLogin, trackPageErrors, uniqueTestId } from './helpers';

test.describe('Admin menu CRUD', () => {
  test('admin can add a drink product to an existing category then remove it', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = trackPageErrors(page);
    const productName = `E2E ${uniqueTestId('prod')}`;

    page.on('dialog', (dialog) => dialog.accept());

    await internalLogin(page, 'admin');
    await page.goto('/admin/menu');
    await expect(page.getByRole('heading', { name: /^menu$/i })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/live sync/i)).toBeVisible({ timeout: 20000 });

    // Use the already-expanded coffee category (first drinks category).
    await page.getByRole('button', { name: /add product/i }).first().click();

    const modal = page.locator('form').filter({ has: page.getByRole('heading', { name: /add product/i }) });
    await expect(modal).toBeVisible();
    await modal.getByPlaceholder(/spanish latte/i).click();
    await modal.getByPlaceholder(/spanish latte/i).fill(productName);
    const price = modal.locator('input[type="number"]').first();
    await price.click();
    await price.fill('150');
    await expect(price).toHaveValue('150');

    await modal.getByRole('button', { name: /^create$/i }).click();

    // Prefer durable success signal: product row actions, not only modal dismiss.
    await expect(page.getByRole('button', { name: new RegExp(`Delete ${productName}`, 'i') })).toBeVisible({
      timeout: 30000,
    });

    const deleteProduct = page.getByRole('button', { name: new RegExp(`Delete ${productName}`, 'i') });
    await deleteProduct.click();
    await deleteProduct.click();
    await expect(page.getByRole('button', { name: new RegExp(`Delete ${productName}`, 'i') })).toHaveCount(0, {
      timeout: 15000,
    });

    expect(errors(), 'no uncaught errors').toEqual([]);
  });
});
