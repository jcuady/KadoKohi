import { test, expect } from '@playwright/test';
import { placeOrderRpc, supabaseAnonConfig, supabaseGet } from './helpers';

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

  test('anon cannot forge paid status on gcash-qr via kk_place_order', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured for API tests');

    const branches = await supabaseGet<{ id: string }[]>(
      request,
      'kk_branches?select=id&status=eq.active&limit=1',
    );
    const products = await supabaseGet<{ id: string }[]>(
      request,
      'kk_products?select=id&visible=eq.true&limit=1',
    );
    const branch = branches?.[0];
    const product = products?.[0];
    test.skip(!branch || !product, 'Need active branch and product seed data');

    const orderId = `e2e-forge-${Date.now()}`;
    const { status, body } = await placeOrderRpc(request, {
      id: orderId,
      channel: 'takeout',
      branch_id: branch.id,
      guest_name: 'E2E Forge Guard',
      payment_method: 'gcash-qr',
      payment_status: 'paid',
      status: 'accepted',
      items: [{ id: `${orderId}-line`, product_id: product.id, qty: 1, item_type: 'coffee' }],
    });

    expect(status).toBe(200);
    expect((body as Record<string, unknown>).payment_method).toBe('gcash-qr');
    expect((body as Record<string, unknown>).payment_status).toBe('unpaid');
    expect((body as Record<string, unknown>).status).toBe('pending');
  });
});
