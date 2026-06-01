import { test, expect } from '@playwright/test';
import { customerLogin, trackPageErrors } from './helpers';

test.describe('Merch storefront', () => {
  test('merch page lists seeded products from Supabase', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/merch');

    await expect(page.getByRole('heading', { name: /shop merch/i })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/claim at branch pickup/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /kado classic tee/i })).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: /^accessories$/i }).click();
    await expect(page.getByRole('button', { name: /ceramic mug 12oz/i })).toBeVisible({ timeout: 10000 });

    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('guest is prompted to sign in before adding merch to cart', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/merch');
    await page.getByRole('button', { name: /kado classic tee/i }).click({ timeout: 20000 });
    await expect(page.getByRole('link', { name: /sign in to order/i })).toBeVisible();
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('signed-in customer can add merch and open checkout cart', async ({ page }) => {
    const errors = trackPageErrors(page);
    await customerLogin(page);
    await page.goto('/merch');

    await page.getByRole('button', { name: /kado classic tee/i }).click({ timeout: 20000 });

    const addBtn = page.getByRole('button', { name: /^add —/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });

    const closedMsg = page.getByText(/online ordering is closed/i);
    if (await closedMsg.isVisible().catch(() => false)) {
      test.skip(true, 'Online order window is closed in local timezone');
    }

    await addBtn.click();

    const cartToggle = page.getByRole('button', { name: /^Cart — \d+ items$/i });
    const cartAlreadyOpen = await page.getByRole('button', { name: /close cart/i }).isVisible().catch(() => false);
    if (!cartAlreadyOpen) {
      await cartToggle.click();
    }

    await expect(page.getByText(/kado classic tee/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /place order/i })).toBeVisible();
    await expect(page.getByText(/gcash qr/i)).toBeVisible();

    expect(errors(), 'no uncaught errors').toEqual([]);
  });
});
