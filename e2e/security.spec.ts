import { test, expect } from '@playwright/test';
import {
  customerAccessToken,
  placeOrderRpc,
  supabaseAnonConfig,
  supabaseGet,
  uniqueTestId,
} from './helpers';

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

  test('customer cannot forge paid on online order via REST update', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured for API tests');

    const token = await customerAccessToken(request);
    test.skip(!token, 'Customer credentials unavailable');

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

    const orderId = uniqueTestId('e2e-forge-online');
    const placed = await placeOrderRpc(
      request,
      {
        id: orderId,
        channel: 'online',
        branch_id: branch.id,
        payment_method: 'gcash-qr',
        payment_status: 'unpaid',
        status: 'pending',
        items: [{ id: `${orderId}-line`, product_id: product.id, qty: 1, item_type: 'coffee' }],
      },
      token,
    );
    expect(placed.status).toBe(200);
    expect((placed.body as Record<string, unknown>).payment_status).toBe('unpaid');

    const forge = await request.patch(`${cfg!.url}/rest/v1/kk_orders?id=eq.${orderId}`, {
      headers: {
        apikey: cfg!.anonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      data: {
        payment_method: 'pay-at-store',
        payment_status: 'paid',
      },
    });

    expect(forge.ok(), `forge must fail, got ${forge.status()} ${await forge.text()}`).toBeFalsy();

    const tracked = await request.post(`${cfg!.url}/rest/v1/rpc/kk_track_order`, {
      headers: {
        apikey: cfg!.anonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: { order_id: orderId },
    });
    expect(tracked.status()).toBe(200);
    const rows = (await tracked.json()) as Array<{ payment_status: string; payment_method: string }>;
    expect(rows[0]?.payment_status).toBe('unpaid');
    expect(rows[0]?.payment_method).toBe('gcash-qr');
  });

  test('merch GCash orders accept guest payment proof RPC', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured for API tests');

    const token = await customerAccessToken(request);
    test.skip(!token, 'Customer credentials unavailable');

    const branches = await supabaseGet<{ id: string }[]>(
      request,
      'kk_branches?select=id&status=eq.active&limit=1',
    );
    const merch = await supabaseGet<{ id: string }[]>(
      request,
      'kk_merch_products?select=id&visible=eq.true&limit=1',
    );
    const branch = branches?.[0];
    const product = merch?.[0];
    test.skip(!branch || !product, 'Need active branch and merch product');

    const orderId = uniqueTestId('e2e-merch-proof');
    const placed = await placeOrderRpc(
      request,
      {
        id: orderId,
        channel: 'merch',
        branch_id: branch.id,
        payment_method: 'gcash-qr',
        payment_status: 'unpaid',
        status: 'pending',
        items: [
          {
            id: `${orderId}-line`,
            product_id: product.id,
            qty: 1,
            item_type: 'merch',
            merch_variants: [{ groupName: 'Size', optionLabel: 'M', priceDelta: 0 }],
          },
        ],
      },
      token,
    );
    expect(placed.status).toBe(200);
    expect((placed.body as Record<string, unknown>).channel).toBe('merch');

    const tinyPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const proof = await request.post(`${cfg!.url}/rest/v1/rpc/kk_submit_guest_payment_proof`, {
      headers: {
        apikey: cfg!.anonKey,
        Authorization: `Bearer ${cfg!.anonKey}`,
        'Content-Type': 'application/json',
      },
      data: { p_order_id: orderId, p_proof_data_url: tinyPng },
    });

    expect(proof.status(), await proof.text()).toBe(200);
    const body = (await proof.json()) as { payment_status?: string };
    expect(body.payment_status).toBe('proof_submitted');
  });
});
