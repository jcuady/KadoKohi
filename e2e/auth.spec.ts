import { test, expect, type Page } from '@playwright/test';
import {
  CREDS,
  disableNativeFormValidation,
  dismissCookieConsent,
  fillCustomerSignIn,
  fillInternalSignIn,
  fillSignupForm,
} from './helpers';

async function gotoAuth(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await dismissCookieConsent(page);
}

/**
 * Auth flows — client validation, role gates, credential errors, and recovery UX.
 * Avoids creating new accounts except duplicate-email (existing test user).
 */

test.describe('Customer login', () => {
  test('empty submit is blocked by required fields', async ({ page }) => {
    await gotoAuth(page, '/auth/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator('#login-email')).toHaveJSProperty('validity.valueMissing', true);
  });

  test('whitespace-only fields show required error', async ({ page }) => {
    await gotoAuth(page, '/auth/login');
    await disableNativeFormValidation(page);
    await page.locator('#login-email').fill('   ');
    await page.locator('#login-password').fill('   ');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/email and password are required/i)).toBeVisible();
  });

  test('invalid email format shows error', async ({ page }) => {
    await gotoAuth(page, '/auth/login');
    await page.locator('#login-email').fill('user@domain');
    await page.locator('#login-password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('wrong credentials shows invalid-credentials error', async ({ page }) => {
    await gotoAuth(page, '/auth/login');
    await fillCustomerSignIn(page, 'nobody-qa@example.com', 'definitely-wrong-pass');
    await expect(page.getByText(/invalid credentials/i)).toBeVisible({ timeout: 20000 });
  });

  test('internal account is rejected on customer login', async ({ page }) => {
    await gotoAuth(page, '/auth/login');
    await fillCustomerSignIn(page, CREDS.admin.email, CREDS.admin.password);
    await expect(page.getByText(/customer accounts only/i)).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Customer signup', () => {
  test('login shows check-email success notice from signup redirect', async ({ page }) => {
    await gotoAuth(page, '/auth/login?check-email=1');
    await expect(page.getByText(/account created/i)).toBeVisible();
    await expect(page.getByText(/signed in automatically/i)).toBeVisible();
    await expect(page.getByText(/next steps/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /resend confirmation email/i })).toBeVisible();
  });

  test('login prefills email from signup redirect query', async ({ page }) => {
    await gotoAuth(page, '/auth/login?check-email=1&email=new.user%40example.com');
    await expect(page.locator('#login-email')).toHaveValue('new.user@example.com');
  });

  test('signup page does not show the old how sign-up works guide', async ({ page }) => {
    await gotoAuth(page, '/auth/signup');
    await expect(page.getByText(/how sign-up works/i)).toHaveCount(0);
    await expect(page.getByText(/confirmation link to this address after you create/i)).toBeVisible();
  });

  test('email confirm page shows error when opened without a token', async ({ page }) => {
    await gotoAuth(page, '/auth/confirm');
    await expect(page.getByRole('heading', { name: /confirming your email/i })).toBeVisible();
    await expect(page.getByText(/invalid or has expired/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /go to sign in/i })).toBeVisible();
  });

  test('password mismatch shows error', async ({ page }) => {
    await gotoAuth(page, '/auth/signup');
    await fillSignupForm(page, { confirm: 'password999' });
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('password field advertises the real minimum (8)', async ({ page }) => {
    await gotoAuth(page, '/auth/signup');
    await expect(page.locator('input#signup-password')).toHaveAttribute('minlength', '8');
    const ph = await page.locator('input#signup-password').getAttribute('placeholder');
    expect(ph ?? '').not.toMatch(/6\+/);
  });

  test('short name shows validation error', async ({ page }) => {
    await gotoAuth(page, '/auth/signup');
    await fillSignupForm(page, { name: 'A' });
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/name must be at least 2 characters/i)).toBeVisible();
  });

  test('invalid phone shows validation error', async ({ page }) => {
    await gotoAuth(page, '/auth/signup');
    await fillSignupForm(page, { phone: '12345' });
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/valid Philippine mobile/i)).toBeVisible();
  });

  test('terms not accepted shows validation error', async ({ page }) => {
    await gotoAuth(page, '/auth/signup');
    await disableNativeFormValidation(page);
    await fillSignupForm(page, { terms: false });
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/accept the Terms of Service/i)).toBeVisible();
  });

  test('duplicate email shows already-registered error', async ({ page }) => {
    await gotoAuth(page, '/auth/signup');
    await fillSignupForm(page, { email: CREDS.customer.email });
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/already registered/i)).toBeVisible({ timeout: 25000 });
    await expect(page).toHaveURL(/\/auth\/signup/);
  });
});

test.describe('Forgot password', () => {
  test('customer forgot-password rejects invalid email', async ({ page }) => {
    await gotoAuth(page, '/auth/forgot-password');
    await page.locator('#forgot-email').fill('user@domain');
    await page.getByRole('button', { name: /send reset link/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('customer forgot-password accepts valid email', async ({ page }) => {
    await gotoAuth(page, '/auth/forgot-password');
    await page.locator('#forgot-email').fill(CREDS.customer.email);
    await page.getByRole('button', { name: /send reset link/i }).click();
    await expect(page.getByText(/if an account exists/i)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/next steps/i)).toBeVisible();
  });

  test('internal forgot-password page loads', async ({ page }) => {
    await gotoAuth(page, '/management-portal/forgot-password');
    await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible();
    await expect(page.locator('#forgot-email')).toBeVisible();
  });
});

test.describe('Reset password', () => {
  test('missing recovery session shows invalid link message', async ({ page }) => {
    await gotoAuth(page, '/auth/reset-password');
    await expect(page.getByText(/invalid or expired/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /request a new one/i })).toBeVisible();
  });

  test('password fields advertise minimum length when form is available', async ({ page }) => {
    await gotoAuth(page, '/auth/login');
    await fillCustomerSignIn(page, CREDS.customer.email, CREDS.customer.password);
    await page.waitForURL(/\/account/, { timeout: 45000 });
    await gotoAuth(page, '/auth/reset-password');
    await expect(page.locator('#reset-password')).toHaveAttribute('minlength', '8', { timeout: 10000 });
    await expect(page.locator('#reset-confirm')).toHaveAttribute('minlength', '8');
  });

  test('password mismatch shows error when recovery form is available', async ({ page }) => {
    await gotoAuth(page, '/auth/login');
    await fillCustomerSignIn(page, CREDS.customer.email, CREDS.customer.password);
    await page.waitForURL(/\/account/, { timeout: 45000 });
    await gotoAuth(page, '/auth/reset-password');
    await page.locator('#reset-password').waitFor({ state: 'visible', timeout: 10000 });
    await disableNativeFormValidation(page);
    await page.locator('#reset-password').fill('newpassword123');
    await page.locator('#reset-confirm').fill('newpassword456');
    await page.getByRole('button', { name: /update password/i }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });
});

test.describe('Role gates', () => {
  test('unauthenticated /admin redirects to management portal', async ({ page }) => {
    await gotoAuth(page, '/admin');
    await expect(page).toHaveURL(/\/management-portal/, { timeout: 20000 });
  });

  test('unauthenticated /account redirects to customer login', async ({ page }) => {
    await gotoAuth(page, '/account');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 20000 });
  });
});

test.describe('Internal portal', () => {
  test('tab switching updates the description', async ({ page }) => {
    await gotoAuth(page, '/management-portal');
    await page.getByRole('button', { name: /^barista$/i }).click();
    await expect(page.getByText(/queue, board, kiosk/i)).toBeVisible();
    await page.getByRole('button', { name: /^staff$/i }).click();
    await expect(page.getByText(/merch fulfillment and booth/i)).toBeVisible();
  });

  test('sign-in button stays disabled until email and password are entered', async ({ page }) => {
    await gotoAuth(page, '/management-portal');
    const button = page.getByRole('button', { name: /^sign in$/i });
    await expect(button).toBeDisabled();
    await page.locator('#internal-email').fill('admin@kadokohi.com');
    await expect(button).toBeDisabled();
    await page.locator('#internal-password').fill('secret');
    await expect(button).toBeEnabled();
  });

  test('invalid email format shows error', async ({ page }) => {
    await gotoAuth(page, '/management-portal');
    await page.locator('#internal-email').fill('user@domain');
    await page.locator('#internal-password').fill('password123');
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('customer account is rejected at the internal portal', async ({ page }) => {
    await gotoAuth(page, '/management-portal');
    await fillInternalSignIn(page, CREDS.customer.email, CREDS.customer.password);
    await expect(page.getByText(/registered as customer/i)).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/management-portal/);
  });

  test('barista credentials on admin tab show role mismatch', async ({ page }) => {
    await gotoAuth(page, '/management-portal');
    await fillInternalSignIn(page, CREDS.barista.email, CREDS.barista.password);
    await expect(page.getByRole('alert').filter({ hasText: /registered as barista/i }).first()).toBeVisible({
      timeout: 20000,
    });
    await expect(page).toHaveURL(/management-portal/);
  });

  test('wrong password shows credential error', async ({ page }) => {
    await gotoAuth(page, '/management-portal');
    await fillInternalSignIn(page, CREDS.admin.email, 'definitely-wrong-pass');
    await expect(page.getByText(/could not sign in|invalid email or password/i)).toBeVisible({
      timeout: 20000,
    });
    await expect(page).toHaveURL(/management-portal/);
  });
});
