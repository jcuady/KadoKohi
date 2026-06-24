import { test, expect } from '@playwright/test';
import { internalLogin, trackPageErrors, uniqueTestId } from './helpers';

test.describe('Admin menu CRUD', () => {
  test('admin can add a category and product then remove them', async ({ page }) => {
    const errors = trackPageErrors(page);
    const catName = `E2E ${uniqueTestId('cat')}`;
    const productName = `E2E ${uniqueTestId('prod')}`;

    page.on('dialog', (dialog) => dialog.accept());

    await internalLogin(page, 'admin');
    await page.goto('/admin/menu');
    await expect(page.getByRole('heading', { name: /menu manager/i })).toBeVisible({ timeout: 20000 });

    await page.getByPlaceholder('New category…').fill(catName);
    await page.getByRole('button', { name: /^add$/i }).click();
    await expect(page.getByText(catName, { exact: true })).toBeVisible({ timeout: 20000 });

    const categoryCard = page.locator('.rounded-2xl.dash-card.border').filter({ hasText: catName });
    await categoryCard.getByRole('button', { name: /add product/i }).click();

    const modal = page.locator('form').filter({ has: page.getByRole('heading', { name: /add product/i }) });
    await expect(modal).toBeVisible();
    await modal.locator('input').first().fill(productName);
    await modal.getByRole('spinbutton').first().fill('150');
    await modal.getByRole('button', { name: /^create$/i }).click();

    await expect(page.getByText(productName)).toBeVisible({ timeout: 20000 });

    const productRow = categoryCard.locator('.rounded-xl.dash-card-alt').filter({ hasText: productName });
    await productRow.getByRole('button', { name: new RegExp(`Delete ${productName}`, 'i') }).click();
    await productRow.getByRole('button', { name: new RegExp(`Delete ${productName}`, 'i') }).click();
    await expect(page.getByText(productName)).toHaveCount(0, { timeout: 15000 });

    await categoryCard.getByRole('button', { name: new RegExp(`Delete ${catName}`, 'i') }).click();
    await expect(page.getByText(catName, { exact: true })).toHaveCount(0, { timeout: 15000 });

    expect(errors(), 'no uncaught errors').toEqual([]);
  });
});
