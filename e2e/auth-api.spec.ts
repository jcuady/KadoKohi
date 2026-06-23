import { test, expect } from '@playwright/test';
import {
  CREDS,
  passwordAccessToken,
  supabaseAnonConfig,
  uniqueTestId,
} from './helpers';

/**
 * Supabase Auth + kk-customer-signup API contracts (anon key only).
 * Complements UI validation in auth.spec.ts.
 */

const cfg = supabaseAnonConfig();
const describeApi = cfg ? test.describe : test.describe.skip;

describeApi('Supabase Auth API', () => {
  test('valid customer password grant returns access_token', async ({ request }) => {
    const token = await passwordAccessToken(request, CREDS.customer.email, CREDS.customer.password);
    expect(token).toBeTruthy();
  });

  test('valid admin password grant returns access_token', async ({ request }) => {
    const token = await passwordAccessToken(request, CREDS.admin.email, CREDS.admin.password);
    expect(token).toBeTruthy();
  });

  test('invalid password returns 400', async ({ request }) => {
    const res = await request.post(`${cfg!.url}/auth/v1/token?grant_type=password`, {
      headers: { apikey: cfg!.anonKey, 'Content-Type': 'application/json' },
      data: { email: CREDS.customer.email, password: 'not-the-real-password' },
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string; error_description?: string; msg?: string };
    const detail = `${body.error_description ?? ''} ${body.error ?? ''} ${body.msg ?? ''}`.toLowerCase();
    expect(detail).toMatch(/invalid|credentials|password/);
  });

  test('signup rejects weak password', async ({ request }) => {
    const email = `${uniqueTestId('weak')}@example.com`;
    const res = await request.post(`${cfg!.url}/auth/v1/signup`, {
      headers: { apikey: cfg!.anonKey, 'Content-Type': 'application/json' },
      data: { email, password: 'short' },
    });
    expect(res.ok()).toBe(false);
  });

  test('signup duplicate email does not issue a session', async ({ request }) => {
    const res = await request.post(`${cfg!.url}/auth/v1/signup`, {
      headers: { apikey: cfg!.anonKey, 'Content-Type': 'application/json' },
      data: { email: CREDS.customer.email, password: 'AnotherPass123!' },
    });
    // GoTrue may return 200 to avoid email enumeration.
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { session?: unknown; access_token?: string; user?: { identities?: unknown[] } };
    expect(body.session ?? body.access_token).toBeFalsy();
  });
});

describeApi('kk-customer-signup edge function', () => {
  const fnUrl = `${cfg!.url}/functions/v1/kk-customer-signup`;
  const headers = {
    apikey: cfg!.anonKey,
    Authorization: `Bearer ${cfg!.anonKey}`,
    'Content-Type': 'application/json',
  };

  test('profileOnly without userId returns 400', async ({ request }) => {
    const res = await request.post(fnUrl, {
      headers,
      data: {
        profileOnly: true,
        email: 'qa@example.com',
        name: 'QA User',
        phone: '9171234567',
      },
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error ?? '').toMatch(/userId/i);
  });

  test('missing required fields returns 400', async ({ request }) => {
    const res = await request.post(fnUrl, {
      headers,
      data: { email: '', name: '', phone: '' },
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error ?? '').toMatch(/required|invalid/i);
  });

  test('invalid phone returns 400', async ({ request }) => {
    const res = await request.post(fnUrl, {
      headers,
      data: {
        email: 'qa@example.com',
        name: 'QA User',
        phone: '12345',
        password: 'ValidPass123',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('short name returns 400', async ({ request }) => {
    const res = await request.post(fnUrl, {
      headers,
      data: {
        email: 'qa@example.com',
        name: 'A',
        phone: '9171234567',
        password: 'ValidPass123',
      },
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error ?? '').toMatch(/name must be at least 2/i);
  });
});
