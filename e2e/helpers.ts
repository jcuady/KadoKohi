import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { type APIRequestContext, type Page, expect } from '@playwright/test';

/**
 * Shared test credentials (Supabase Auth + kk_profiles on project idwtlujcdfnnndxmlaco).
 */
export const CREDS = {
  admin: { email: 'admin@kadokohi.com', password: 'KadoKohi2026!' },
  barista: { email: 'barista@kadokohi.com', password: 'KadoKohi2026!' },
  staff: { email: 'staff@kadokohi.com', password: 'KadoKohi2026!' },
  customer: { email: 'customer@kadokohi.com', password: 'KadoKohi2026!' },
};

/** Internal portal sign-in (email + password only — no verification codes). */
export async function fillInternalSignIn(page: Page, email: string, password: string): Promise<void> {
  const emailInput = page.locator('#internal-email');
  await emailInput.waitFor({ state: 'visible', timeout: 20000 });
  await emailInput.fill(email);
  await page.locator('#internal-password').fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
}

/** Customer login form (email + password). */
export async function fillCustomerSignIn(page: Page, email: string, password: string): Promise<void> {
  const emailInput = page.locator('#login-email');
  await emailInput.waitFor({ state: 'visible', timeout: 20000 });
  await emailInput.fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
}

/** Dismiss cookie banner when it blocks taps (common on mobile e2e). */
export async function dismissCookieConsent(page: Page): Promise<void> {
  const accept = page.getByRole('button', { name: /I accept cookies/i });
  try {
    if (await accept.isVisible({ timeout: 1500 })) {
      await accept.click({ timeout: 5000, noWaitAfter: true });
    }
  } catch {
    // Banner may animate away or already be dismissed.
  }
}

/** Sign in via the customer login form and wait for the account area. */
export async function customerLogin(page: Page): Promise<void> {
  await page.goto('/auth/login');
  await dismissCookieConsent(page);
  await fillCustomerSignIn(page, CREDS.customer.email, CREDS.customer.password);
  await page.waitForURL(/\/account/, { timeout: 45000 });
}

/** Clear Supabase auth token so the next login starts from a clean session. */
export async function clearSupabaseSession(page: Page): Promise<void> {
  const cfg = supabaseAnonConfig();
  if (!cfg) return;
  const projectRef = new URL(cfg.url).hostname.split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;
  await page.evaluate((key) => localStorage.removeItem(key), storageKey);
}

type InternalRole = 'admin' | 'barista' | 'staff';

/** Sign in via the internal portal for admin, barista, or staff. */
export async function internalLogin(
  page: Page,
  role: InternalRole,
  creds?: { email: string; password: string },
): Promise<void> {
  const login =
    creds ??
    (role === 'admin' || role === 'barista' || role === 'staff' ? CREDS[role] : undefined);
  if (!login) {
    throw new Error(`No credentials configured for internal role: ${role}`);
  }
  await page.goto('/management-portal');
  await dismissCookieConsent(page);
  await page.getByRole('button', { name: new RegExp(`^${role}$`, 'i'), exact: false }).first().click();
  await fillInternalSignIn(page, login.email, login.password);
  await page.waitForURL(new RegExp(`/${role}`), { timeout: 45000 });
}

/**
 * Attach an uncaught-exception listener. Returns a getter for collected errors.
 * Uncaught page errors are a strong signal of a real runtime bug.
 */
export function trackPageErrors(page: Page): () => string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    if (err instanceof Error) {
      errors.push(err.message);
      return;
    }
    errors.push(String(err));
  });
  return () => errors;
}

/** Assert the document is not wider than the viewport (catches mobile overflow). */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(2);
}

function loadDotEnv(): Record<string, string> {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return {};
  return Object.fromEntries(
    readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        let val = l.slice(i + 1);
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        return [l.slice(0, i), val];
      }),
  );
}

/** Supabase anon credentials for API-level security tests (from .env or process.env). */
export function supabaseAnonConfig(): { url: string; anonKey: string } | null {
  const file = loadDotEnv();
  const url = process.env.VITE_SUPABASE_URL ?? file.VITE_SUPABASE_URL;
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    file.VITE_SUPABASE_ANON_KEY ??
    file.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function uniqueTestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

/** Fill the customer signup form (defaults are valid; override fields to test validation). */
export async function fillSignupForm(
  page: Page,
  overrides: Partial<{
    name: string;
    email: string;
    phone: string;
    password: string;
    confirm: string;
    terms: boolean;
  }> = {},
): Promise<void> {
  const values = {
    name: 'QA Tester',
    email: `qa+${uniqueTestId('signup')}@example.com`,
    phone: '9171234567',
    password: 'TestPass1',
    confirm: 'TestPass1',
    terms: true,
    ...overrides,
  };
  await page.locator('input#signup-name').fill(values.name);
  await page.locator('input#signup-email').fill(values.email);
  await page.locator('input#signup-phone').fill(values.phone);
  await page.locator('input#signup-password').fill(values.password);
  await page.locator('input#signup-confirm').fill(values.confirm);
  const termsCheckbox = page.getByRole('checkbox', { name: /terms of service/i });
  const termsChecked = await termsCheckbox.isChecked();
  if (values.terms && !termsChecked) {
    await page.locator('label[for="signup-terms"]').click();
  } else if (!values.terms && termsChecked) {
    await page.locator('label[for="signup-terms"]').click();
  }
}

/** Disable native HTML5 validation so client-side branches can be exercised. */
export async function disableNativeFormValidation(page: Page): Promise<void> {
  await page.locator('form').first().evaluate((form) => form.setAttribute('novalidate', 'novalidate'));
}

function supabaseHeaders(cfg: { url: string; anonKey: string }, token?: string) {
  const bearer = token ?? cfg.anonKey;
  return {
    apikey: cfg.anonKey,
    Authorization: `Bearer ${bearer}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Supabase access token for API tests (password sign-in).
 * Returns null when credentials or config are unavailable.
 */
export async function customerAccessToken(request: APIRequestContext): Promise<string | null> {
  return passwordAccessToken(request, CREDS.customer.email, CREDS.customer.password);
}

/**
 * Supabase access token for API tests (password sign-in).
 * Returns null when credentials or config are unavailable.
 */
export async function passwordAccessToken(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string | null> {
  const cfg = supabaseAnonConfig();
  if (!cfg) return null;

  const res = await request.post(`${cfg.url}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: cfg.anonKey,
      'Content-Type': 'application/json',
    },
    data: { email, password },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as { access_token?: string };
  return body.access_token ?? null;
}

export async function supabaseGet<T>(
  request: APIRequestContext,
  path: string,
  token?: string,
): Promise<T | null> {
  const cfg = supabaseAnonConfig();
  if (!cfg) return null;

  const res = await request.get(`${cfg.url}/rest/v1/${path}`, {
    headers: supabaseHeaders(cfg, token),
  });
  if (!res.ok()) return null;
  return (await res.json()) as T;
}

export async function placeOrderRpc(
  request: APIRequestContext,
  payload: Record<string, unknown>,
  token?: string,
): Promise<{ status: number; body: Record<string, unknown> | string }> {
  const cfg = supabaseAnonConfig();
  if (!cfg) return { status: 0, body: 'missing supabase config' };

  const res = await request.post(`${cfg.url}/rest/v1/rpc/kk_place_order`, {
    headers: supabaseHeaders(cfg, token),
    data: { payload },
  });

  const text = await res.text();
  try {
    return { status: res.status(), body: JSON.parse(text) as Record<string, unknown> };
  } catch {
    return { status: res.status(), body: text };
  }
}

type TableCodeRow = { code: string; label?: string };
type BranchSlugRow = { slug: string; name?: string };

/** First active dine-in table code (for valid QR URL tests). */
export async function fetchActiveTableCode(request: APIRequestContext): Promise<string | null> {
  const rows = await supabaseGet<TableCodeRow[]>(
    request,
    'kk_tables?select=code&active=eq.true&limit=1',
  );
  return rows?.[0]?.code ?? null;
}

/** First active branch slug (for takeout `?b=` tests). */
export async function fetchActiveBranchSlug(request: APIRequestContext): Promise<string | null> {
  const rows = await supabaseGet<BranchSlugRow[]>(
    request,
    'kk_branches?select=slug&status=eq.active&limit=1',
  );
  return rows?.[0]?.slug ?? null;
}

/** Add the first in-stock item from a guest menu grid (QR / takeout product sheet). */
export async function addFirstGuestMenuItem(page: Page): Promise<void> {
  await dismissCookieConsent(page);
  const grid = page.locator('.guest-order-product-grid');
  await grid.waitFor({ state: 'visible', timeout: 20000 });
  const products = grid.locator('button:not([disabled])');
  const count = await products.count();
  expect(count, 'need at least one orderable menu item').toBeGreaterThan(0);

  for (let i = 0; i < Math.min(count, 5); i++) {
    await products.nth(i).click();
    await expect(page.getByText('Customize')).toBeVisible({ timeout: 5000 });
    const sheet = page.locator('div.fixed.inset-x-0.bottom-0').filter({ hasText: 'Customize' }).last();
    const addBtn = sheet.getByRole('button', { name: /add to (order|table order)/i });
    if (await addBtn.isEnabled().catch(() => false)) {
      await addBtn.scrollIntoViewIfNeeded();
      await addBtn.click();
      await expect(page.getByText('Customize')).toHaveCount(0, { timeout: 5000 });
      return;
    }
    await sheet.getByRole('button', { name: /close/i }).click();
  }

  throw new Error('Could not add any in-stock guest menu item');
}

export function rpcErrorMessage(body: Record<string, unknown> | string): string {
  if (typeof body === 'string') return body;
  const msg = body.message;
  return typeof msg === 'string' ? msg : JSON.stringify(body);
}

export async function trackOrderRpc(
  request: APIRequestContext,
  orderId: string,
): Promise<Record<string, unknown>[]> {
  const cfg = supabaseAnonConfig();
  if (!cfg) return [];

  const res = await request.post(`${cfg.url}/rest/v1/rpc/kk_track_order`, {
    headers: supabaseHeaders(cfg),
    data: { order_id: orderId },
  });
  if (!res.ok()) return [];
  const body = await res.json();
  return Array.isArray(body) ? (body as Record<string, unknown>[]) : [];
}
