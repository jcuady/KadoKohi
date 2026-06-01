import { test, expect } from '@playwright/test';
import { supabaseAnonConfig } from './helpers';

test.describe('Supabase RLS security', () => {
  test('anon cannot enumerate guest orders via REST', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured for API tests');

    const res = await request.get(
      `${cfg!.url}/rest/v1/kk_orders?select=id,short_code&channel=in.(dine-in,takeout)&customer_id=is.null&limit=5`,
      {
        headers: {
          apikey: cfg!.anonKey,
          Authorization: `Bearer ${cfg!.anonKey}`,
        },
      },
    );

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body, 'guest orders must not be listable by anon').toEqual([]);
  });

  test('anon cannot insert orders directly via REST', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured for API tests');

    const res = await request.post(`${cfg!.url}/rest/v1/kk_orders`, {
      headers: {
        apikey: cfg!.anonKey,
        Authorization: `Bearer ${cfg!.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      data: {
        id: '00000000-0000-0000-0000-000000000099',
        short_code: 'KK-9999',
        channel: 'takeout',
        branch_id: 'invalid-branch',
        payment_status: 'unpaid',
        status: 'pending',
        subtotal: 1,
        modifiers_total: 0,
        tax: 0,
        total: 1,
      },
    });

    expect(res.status(), 'direct insert must be denied').toBe(401);
  });

  test('kk_track_order RPC still works for anon with a fake id', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured for API tests');

    const res = await request.post(`${cfg!.url}/rest/v1/rpc/kk_track_order`, {
      headers: {
        apikey: cfg!.anonKey,
        Authorization: `Bearer ${cfg!.anonKey}`,
        'Content-Type': 'application/json',
      },
      data: { order_id: '00000000-0000-0000-0000-000000000000' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});
