import { test, expect } from '@playwright/test';
import {
  disableNativeFormValidation,
  fetchActiveBranchSlug,
  internalLogin,
  supabaseAnonConfig,
  trackPageErrors,
  uniqueTestId,
} from './helpers';

test.describe('Admin branch and user controls', () => {
  test('branches page lists active branches from Supabase', async ({ page, request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');

    const slug = await fetchActiveBranchSlug(request);
    test.skip(!slug, 'No active branch in seed data');

    const errors = trackPageErrors(page);
    await internalLogin(page, 'admin');
    await page.goto('/admin/branches');
    await expect(page.getByRole('heading', { name: /^branches$/i })).toBeVisible();
    await expect(page.locator('span.font-mono.dash-muted', { hasText: slug })).toBeVisible({
      timeout: 15000,
    });
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('tables page loads branch selector and table list', async ({ page }) => {
    const errors = trackPageErrors(page);
    await internalLogin(page, 'admin');
    await page.goto('/admin/tables');
    await expect(page.getByRole('heading', { name: /tables & qr/i })).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible({ timeout: 20000 });
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('branch form rejects duplicate slug client-side', async ({ page, request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');

    const slug = await fetchActiveBranchSlug(request);
    test.skip(!slug, 'No active branch in seed data');

    await internalLogin(page, 'admin');
    await page.goto('/admin/branches');

    const form = page.locator('form').filter({ has: page.getByRole('heading', { name: /add branch/i }) });
    await form.locator('input').first().fill(slug);
    await form.locator('input').nth(1).fill('Duplicate Slug Test Branch');
    await form.getByRole('button', { name: /^create$/i }).click();

    await expect(
      page.getByText(/slug is already used by another branch/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test('new user form requires branch for barista', async ({ page }) => {
    await internalLogin(page, 'admin');
    await page.goto('/admin/users');
    await page.getByRole('button', { name: /add user/i }).click();

    const modal = page.locator('form').filter({ has: page.getByRole('heading', { name: /new user/i }) });
    await disableNativeFormValidation(page);
    await modal.locator('input').first().fill('QA Barista');
    await modal.locator('input[type="email"]').fill(`qa+${uniqueTestId('barista')}@example.com`);
    await modal.locator('input[type="password"]').fill('password123');
    await modal.locator('select').first().selectOption('barista');
    await modal.locator('select').nth(1).selectOption('');

    await modal.getByRole('button', { name: /^create$/i }).click();
    await expect(modal.getByText(/branch is required for barista \/ staff/i)).toBeVisible();
  });

  test('new user form rejects short password', async ({ page }) => {
    await internalLogin(page, 'admin');
    await page.goto('/admin/users');
    await page.getByRole('button', { name: /add user/i }).click();

    const modal = page.locator('form').filter({ has: page.getByRole('heading', { name: /new user/i }) });
    await disableNativeFormValidation(page);
    await modal.locator('input').first().fill('QA Short PW');
    await modal.locator('input[type="email"]').fill(`qa+${uniqueTestId('shortpw')}@example.com`);
    await modal.locator('input[type="password"]').fill('short');
    await modal.locator('select').first().selectOption('admin');

    await modal.getByRole('button', { name: /^create$/i }).click();
    await expect(modal.getByText(/password must be at least 8 characters/i)).toBeVisible();
  });
});
