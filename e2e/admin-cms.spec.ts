import { test, expect } from '@playwright/test';
import { internalLogin, trackPageErrors } from './helpers';

const CMS_ROUTES = ['/admin/landing', '/admin/blog', '/admin/careers', '/admin/pastries', '/admin/booth-content', '/admin/events', '/admin/merch'];

test.describe('Admin CMS', () => {
  test('CMS routes render without uncaught errors', async ({ page }) => {
    const errors = trackPageErrors(page);
    await internalLogin(page, 'admin');
    for (const route of CMS_ROUTES) {
      await page.goto(route);
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 20000 });
    }
    expect(errors(), `uncaught errors: ${errors().join(' | ')}`).toEqual([]);
  });

  test('blog new-post modal opens and cancels cleanly', async ({ page }) => {
    await internalLogin(page, 'admin');
    await page.goto('/admin/blog');
    await page.getByRole('button', { name: /new post/i }).click();
    await expect(page.getByRole('heading', { name: /new post/i })).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('heading', { name: /new post/i })).toHaveCount(0);
  });

  test('careers publish waits for hydration', async ({ page }) => {
    await internalLogin(page, 'admin');
    await page.goto('/admin/careers');
    const publish = page.getByRole('button', { name: 'Publish careers page', exact: true });
    await expect(publish).toBeVisible({ timeout: 20000 });
    await expect(publish).toBeEnabled({ timeout: 20000 });
    await expect(publish).toHaveText(/publish careers page/i);
  });

  test('booth content publish waits for hydration', async ({ page }) => {
    await internalLogin(page, 'admin');
    await page.goto('/admin/booth-content');
    const publish = page.getByRole('button', { name: /publish coffee cart|loading/i });
    await expect(publish).toBeVisible({ timeout: 20000 });
    await expect(publish).toBeEnabled({ timeout: 20000 });
  });

  test('booth coffee cart publish round-trip', async ({ page }) => {
    await internalLogin(page, 'admin');
    await page.goto('/admin/booth-content');
    const publish = page.getByRole('button', { name: /publish coffee cart/i });
    await expect(publish).toBeEnabled({ timeout: 20000 });

    const titleField = page
      .locator('label')
      .filter({ hasText: /^Title line 1$/ })
      .locator('..')
      .locator('input[type="text"]')
      .first();
    await expect(titleField).toBeVisible();
    const original = await titleField.inputValue();
    const marker = `${original.replace(/\s+e2e$/i, '').trim()} e2e`;
    await titleField.fill(marker);
    await publish.click();
    await expect(page.getByText(/coffee cart page published/i)).toBeVisible({ timeout: 20000 });

    await page.goto('/book/coffee-cart');
    await expect(page.locator('h1.font-display')).toContainText(marker, { timeout: 20000 });

    await page.goto('/admin/booth-content');
    await expect(publish).toBeEnabled({ timeout: 20000 });
    await titleField.fill(original);
    await publish.click();
    await expect(page.getByText(/coffee cart page published/i)).toBeVisible({ timeout: 20000 });
  });

  test('booth matcha bar publish round-trip', async ({ page }) => {
    await internalLogin(page, 'admin');
    await page.goto('/admin/booth-content');
    await page.getByRole('button', { name: /^matcha bar$/i }).click();

    const publish = page.getByRole('button', { name: /publish matcha bar/i });
    await expect(publish).toBeEnabled({ timeout: 20000 });

    const titleField = page
      .locator('label')
      .filter({ hasText: /^Title line 1$/ })
      .locator('..')
      .locator('input[type="text"]')
      .first();
    await expect(titleField).toBeVisible();
    const original = await titleField.inputValue();
    const marker = `${original.replace(/\s+e2e$/i, '').trim()} e2e`;
    await titleField.fill(marker);
    await publish.click();
    await expect(page.getByText(/matcha bar page published/i)).toBeVisible({ timeout: 20000 });

    await page.goto('/book/matcha-bar');
    await expect(page.locator('h1.font-display')).toContainText(marker, { timeout: 20000 });

    await page.goto('/admin/booth-content');
    await page.getByRole('button', { name: /^matcha bar$/i }).click();
    await expect(publish).toBeEnabled({ timeout: 20000 });
    await titleField.fill(original);
    await publish.click();
    await expect(page.getByText(/matcha bar page published/i)).toBeVisible({ timeout: 20000 });
  });

  test('pastries publish waits for hydration', async ({ page }) => {
    await internalLogin(page, 'admin');
    await page.goto('/admin/pastries');
    const publish = page.getByRole('button', { name: 'Publish pastries page', exact: true });
    await expect(publish).toBeVisible({ timeout: 20000 });
    await expect(publish).toBeEnabled({ timeout: 20000 });
  });

  test('landing publish round-trip saves and reverts', async ({ page }) => {
    await internalLogin(page, 'admin');
    await page.goto('/admin/landing');
    await expect(page.getByRole('button', { name: 'Save to site' })).toBeVisible({ timeout: 20000 });

    const hero = page.locator('#cms-section-hero');
    await hero.getByRole('button', { name: /^edit$/i }).click();
    await hero.getByTitle('Section settings (paths, slides, products)').click();
    await expect(hero.getByRole('heading', { name: 'Hero — Labels & CTAs' })).toBeVisible({ timeout: 15000 });

    const heroLabels = hero.locator('section').filter({
      has: page.getByRole('heading', { name: 'Hero — Labels & CTAs' }),
    });
    const locationBadge = heroLabels
      .locator('label')
      .filter({ hasText: /^Location badge$/ })
      .locator('..')
      .locator('input[type="text"]')
      .first();
    await expect(locationBadge).toBeVisible();
    const original = await locationBadge.inputValue();
    await locationBadge.fill(`${original} e2e`);
    await page.getByRole('button', { name: 'Save to site' }).click();
    await expect(page.getByText(/saved to database/i)).toBeVisible({ timeout: 20000 });
    await locationBadge.fill(original);
    await page.getByRole('button', { name: 'Save to site' }).click();
    await expect(page.getByText(/saved to database/i)).toBeVisible({ timeout: 20000 });
  });
});
