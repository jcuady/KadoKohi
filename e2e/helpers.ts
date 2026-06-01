import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { type Page, expect } from '@playwright/test';

/**
 * Shared test credentials (live Supabase project idwtlujcdfnnndxmlaco).
 * All seeded accounts share the same password.
 */
export const CREDS = {
  admin: { email: 'admin@kadokohi.com', password: 'KadoKohi2026!' },
  barista: { email: 'barista@kadokohi.com', password: 'KadoKohi2026!' },
  customer: { email: 'customer@kadokohi.com', password: 'KadoKohi2026!' },
};

/** Sign in via the customer login form and wait for the account area. */
export async function customerLogin(page: Page): Promise<void> {
  await page.goto('/auth/login');
  await page.locator('input#email').fill(CREDS.customer.email);
  await page.locator('input#password').fill(CREDS.customer.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/account/, { timeout: 30000 });
}

/** Sign in via the internal portal for admin or barista. */
export async function internalLogin(page: Page, role: 'admin' | 'barista'): Promise<void> {
  await page.goto('/management-portal');
  await page.getByRole('button', { name: new RegExp(`^${role}$`, 'i'), exact: false }).first().click();
  await page.locator('input#email').fill(CREDS[role].email);
  await page.locator('input#password').fill(CREDS[role].password);
  await page.getByRole('button', { name: /sign in —/i }).click();
  await page.waitForURL(new RegExp(`/${role}`), { timeout: 30000 });
}

/**
 * Attach an uncaught-exception listener. Returns a getter for collected errors.
 * Uncaught page errors are a strong signal of a real runtime bug.
 */
export function trackPageErrors(page: Page): () => string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
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
