import { test, expect } from '@playwright/test';

/**
 * Auth form validation — exercises the client-side validation branches that are
 * NOT covered by native HTML5 constraints, plus credential-error handling.
 * These do not create any data.
 */

test.describe('Customer login validation', () => {
  test('empty submit shows required error (no native required on this form)', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/email and password are required/i)).toBeVisible();
  });

  test('wrong credentials shows invalid-credentials error', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('input#email').fill('nobody-qa@example.com');
    await page.locator('input#password').fill('definitely-wrong-pass');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid credentials/i)).toBeVisible({ timeout: 20000 });
  });

  test('invalid email format shows error', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('input#email').fill('user@domain');
    await page.locator('input#password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });
});

test.describe('Customer signup validation', () => {
  test('password mismatch shows error', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.locator('input#signup-name').fill('QA Tester');
    await page.locator('input#signup-email').fill(`qa+${Date.now()}@example.com`);
    await page.locator('input#signup-password').fill('password123');
    await page.locator('input#signup-confirm').fill('password999');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('password field advertises the real minimum (8)', async ({ page }) => {
    await page.goto('/auth/signup');
    // minLength attribute must match the JS rule (>= 8).
    await expect(page.locator('input#signup-password')).toHaveAttribute('minlength', '8');
    // Placeholder copy should not contradict the enforced minimum.
    const ph = await page.locator('input#signup-password').getAttribute('placeholder');
    expect(ph ?? '').not.toMatch(/6\+/);
  });
});

test.describe('Internal portal', () => {
  test('tab switching updates the description', async ({ page }) => {
    await page.goto('/management-portal');
    await page.getByRole('button', { name: /^barista$/i }).click();
    await expect(page.getByText(/queue, board, kiosk/i)).toBeVisible();
    await page.getByRole('button', { name: /^staff$/i }).click();
    await expect(page.getByText(/merch and booth booking/i)).toBeVisible();
  });

  test('customer account is rejected at the internal portal', async ({ page }) => {
    await page.goto('/management-portal');
    await page.locator('input#email').fill('customer@kadokohi.com');
    await page.locator('input#password').fill('KadoKohi2026!');
    await page.getByRole('button', { name: /sign in —/i }).click();
    await expect(
      page.getByText(/for admin, barista, and staff accounts only/i),
    ).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/management-portal/);
  });
});
