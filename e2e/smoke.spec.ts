import { test, expect } from '@playwright/test';

/**
 * Smoke tests — verify the customer-facing app boots, key public routes
 * render, auth forms are present, and the PWA assets are served. These do
 * NOT hit Supabase (no credentials in CI); they assert the shell is healthy
 * and responsive across desktop + mobile projects.
 */

test('home page loads with branding', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Kado Coffee/i);
  // Root mounts and renders something visible.
  await expect(page.locator('#root')).not.toBeEmpty();
});

test('no horizontal overflow on mobile home', async ({ page }) => {
  await page.goto('/');
  // Body should not be wider than the viewport (catches layout overflow bugs).
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(2);
});

test('menu page renders', async ({ page }) => {
  await page.goto('/menu');
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page).toHaveURL(/\/menu/);
});

test('careers page renders open roles and apply flow', async ({ page }) => {
  await page.goto('/careers');
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page.getByRole('heading', { name: /build the tambayan/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^barista$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /marketing manager/i })).toBeVisible();
  await page.getByRole('button', { name: /apply now/i }).first().click();
  const applyDialog = page.getByRole('dialog', { name: /apply to kado kohi/i });
  await expect(applyDialog).toBeVisible();
  await expect(applyDialog.getByPlaceholder(/your name/i)).toBeVisible();
  await expect(applyDialog.getByPlaceholder(/you@email/i)).toBeVisible();
});

test('customer login form renders', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: /^sign in$/i })).toBeVisible();
  await expect(page.locator('#login-email')).toBeVisible();
  await expect(page.locator('#login-password')).toBeVisible();
});

test('customer signup form renders', async ({ page }) => {
  await page.goto('/auth/signup');
  await expect(page.locator('input[type="email"]').first()).toBeVisible();
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
});

test('internal portal renders role tabs', async ({ page }) => {
  await page.goto('/management-portal');
  await expect(page.getByText(/management portal/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /^admin$/i })).toBeVisible();
});

test('PWA manifest + primary icon are served', async ({ page, request }) => {
  await page.goto('/');
  // vite-plugin-pwa injects a manifest link.
  const manifestHref = await page.locator('link[rel="manifest"][href*="manifest.webmanifest"]').getAttribute('href');
  expect(manifestHref, 'manifest link should be present').toBeTruthy();

  const icon = await request.get('/icons/icon-192x192.png');
  expect(icon.status(), '192x192 PWA icon should be reachable').toBe(200);

  const favicon = await request.get('/icons/favicon.ico');
  expect(favicon.status(), 'favicon should be reachable').toBe(200);

  const rootFavicon = await request.get('/favicon.ico');
  expect(rootFavicon.status(), 'root favicon.ico should be reachable').toBe(200);
  expect(rootFavicon.headers()['content-type'] ?? '', 'root favicon must be an image').toMatch(/image|icon/i);
  const faviconBytes = await rootFavicon.body();
  expect(
    faviconBytes.slice(0, 20).toString('utf8').toLowerCase(),
    'favicon must not be SPA HTML',
  ).not.toContain('<!doctype');

  for (const path of ['/icons/favicon-48x48.png', '/icons/favicon-96x96.png']) {
    const resp = await request.get(path);
    expect(resp.status(), `${path} should be reachable`).toBe(200);
    expect(resp.headers()['content-type'] ?? '', `${path} must be png`).toMatch(/image\/png/i);
  }
});

test('favicon route must not return SPA 404 page', async ({ page }) => {
  const resp = await page.goto('/favicon.ico');
  expect(resp?.status()).toBeLessThan(400);
  await expect(page.getByText(/page not found/i)).toHaveCount(0);
});

test('unknown route falls back to SPA (no hard 404)', async ({ page }) => {
  const resp = await page.goto('/this-route-does-not-exist');
  // SPA fallback serves index.html (200); client router shows NotFound.
  expect(resp?.status()).toBeLessThan(400);
  await expect(page.locator('#root')).not.toBeEmpty();
});
