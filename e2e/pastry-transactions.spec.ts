import { test, expect } from '@playwright/test';
import {
  customerAccessToken,
  passwordAccessToken,
  placeOrderRpc,
  rpcErrorMessage,
  supabaseAnonConfig,
  trackOrderRpc,
  uniqueTestId,
  CREDS,
} from './helpers';

type ProductRow = { id: string; name: string; visible: boolean; in_stock: boolean };
type BranchRow = { id: string };
type TableRow = { id: string; label: string; branch_id: string };

function cookieLine(productId = 'cookie_klassic') {
  return {
    id: uniqueTestId('line'),
    product_id: productId,
    product_name_snapshot: productId,
    item_type: 'coffee',
    qty: 1,
  };
}

function kukiBoxLine(cookies: Record<string, number>) {
  return {
    id: uniqueTestId('line'),
    product_id: 'kuki_box_4',
    product_name_snapshot: 'Kuki Box - 4 pcs',
    item_type: 'coffee',
    qty: 1,
    merch_variants: Object.entries(cookies)
      .filter(([, q]) => q > 0)
      .map(([optionId, qty]) => ({
        groupName: 'Cookies',
        optionId,
        optionLabel: qty > 1 ? `${optionId} ×${qty}` : optionId,
        priceDelta: 0,
        qty,
      })),
  };
}

test.describe('Pastry transactional matrix (kk_place_order)', () => {
  test('pastry SKUs are visible and in stock', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');

    const res = await request.get(
      `${cfg!.url}/rest/v1/kk_products?select=id,name,visible,in_stock&id=in.(cookie_klassic,kuki_box_4,kuki_pack_single)`,
      {
        headers: { apikey: cfg!.anonKey, Authorization: `Bearer ${cfg!.anonKey}` },
      },
    );
    expect(res.ok()).toBeTruthy();
    const rows = (await res.json()) as ProductRow[];
    expect(rows.length).toBe(3);
    for (const row of rows) {
      expect(row.visible, row.id).toBe(true);
      expect(row.in_stock, row.id).toBe(true);
    }
  });

  test('online guest pastry + gcash-qr is unpaid', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');

    const branches = await request
      .get(`${cfg!.url}/rest/v1/kk_branches?select=id&status=eq.active&limit=1`, {
        headers: { apikey: cfg!.anonKey, Authorization: `Bearer ${cfg!.anonKey}` },
      })
      .then((r) => r.json() as Promise<BranchRow[]>);
    const branch = branches[0];
    test.skip(!branch, 'Need active branch');

    const orderId = uniqueTestId('pastry-online');
    const { status, body } = await placeOrderRpc(request, {
      id: orderId,
      channel: 'online',
      branch_id: branch.id,
      guest_name: 'E2E Pastry Online',
      payment_method: 'gcash-qr',
      payment_status: 'unpaid',
      status: 'pending',
      items: [cookieLine()],
    });

    expect(status).toBe(200);
    expect((body as Record<string, unknown>).payment_status).toBe('unpaid');
    expect((body as Record<string, unknown>).payment_method).toBe('gcash-qr');

    const tracked = await trackOrderRpc(request, orderId);
    expect(tracked[0]?.channel).toBe('online');
  });

  test('dine-in pastry pay-at-store is paid; takeout pastry paymongo unpaid', async ({
    request,
  }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');

    const headers = { apikey: cfg!.anonKey, Authorization: `Bearer ${cfg!.anonKey}` };
    const branches = (await (
      await request.get(`${cfg!.url}/rest/v1/kk_branches?select=id&status=eq.active&limit=1`, {
        headers,
      })
    ).json()) as BranchRow[];
    const branch = branches[0];
    test.skip(!branch, 'Need branch');

    const tables = (await (
      await request.get(
        `${cfg!.url}/rest/v1/kk_tables?select=id,label,branch_id&active=eq.true&branch_id=eq.${branch.id}&limit=1`,
        { headers },
      )
    ).json()) as TableRow[];
    const table = tables[0];
    test.skip(!table, 'Need table');

    const dineInId = uniqueTestId('pastry-di');
    const dineIn = await placeOrderRpc(request, {
      id: dineInId,
      channel: 'dine-in',
      branch_id: branch.id,
      table_id: table.id,
      payment_method: 'pay-at-store',
      payment_status: 'paid',
      status: 'pending',
      items: [cookieLine()],
    });
    expect(dineIn.status).toBe(200);
    expect((dineIn.body as Record<string, unknown>).payment_status).toBe('paid');

    const takeoutId = uniqueTestId('pastry-to-pm');
    const takeout = await placeOrderRpc(request, {
      id: takeoutId,
      channel: 'takeout',
      branch_id: branch.id,
      guest_name: 'E2E Pastry TO',
      payment_method: 'paymongo',
      payment_status: 'unpaid',
      status: 'pending',
      items: [cookieLine()],
    });
    expect(takeout.status).toBe(200);
    expect((takeout.body as Record<string, unknown>).payment_status).toBe('unpaid');
    expect((takeout.body as Record<string, unknown>).payment_method).toBe('paymongo');
  });

  test('kuki box exact fill places; underfill rejected', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');

    const headers = { apikey: cfg!.anonKey, Authorization: `Bearer ${cfg!.anonKey}` };
    const branches = (await (
      await request.get(`${cfg!.url}/rest/v1/kk_branches?select=id&status=eq.active&limit=1`, {
        headers,
      })
    ).json()) as BranchRow[];
    const branch = branches[0];
    test.skip(!branch, 'Need branch');

    const okId = uniqueTestId('kuki-ok');
    const ok = await placeOrderRpc(request, {
      id: okId,
      channel: 'takeout',
      branch_id: branch.id,
      guest_name: 'E2E Kuki OK',
      payment_method: 'gcash-qr',
      payment_status: 'unpaid',
      status: 'pending',
      items: [kukiBoxLine({ cookie_klassic: 2, cookie_campfire: 2 })],
    });
    expect(ok.status).toBe(200);

    const badId = uniqueTestId('kuki-bad');
    const bad = await placeOrderRpc(request, {
      id: badId,
      channel: 'takeout',
      branch_id: branch.id,
      guest_name: 'E2E Kuki Bad',
      payment_method: 'pay-at-store',
      payment_status: 'paid',
      status: 'pending',
      items: [kukiBoxLine({ cookie_klassic: 2 })],
    });
    expect(bad.status).toBeGreaterThanOrEqual(400);
    expect(rpcErrorMessage(bad.body)).toMatch(/kuki|cookie|fill|exact|slot|4/i);
  });

  test('online unpaid cannot switch to pay-at-store; dine-in can', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');

    const headers = { apikey: cfg!.anonKey, Authorization: `Bearer ${cfg!.anonKey}` };
    const branches = (await (
      await request.get(`${cfg!.url}/rest/v1/kk_branches?select=id&status=eq.active&limit=1`, {
        headers,
      })
    ).json()) as BranchRow[];
    const branch = branches[0];
    test.skip(!branch, 'Need branch');

    const tables = (await (
      await request.get(
        `${cfg!.url}/rest/v1/kk_tables?select=id,label,branch_id&active=eq.true&branch_id=eq.${branch.id}&limit=1`,
        { headers },
      )
    ).json()) as TableRow[];
    const table = tables[0];
    test.skip(!table, 'Need table');

    const onlineId = uniqueTestId('pastry-sw-online');
    await placeOrderRpc(request, {
      id: onlineId,
      channel: 'online',
      branch_id: branch.id,
      guest_name: 'E2E Switch Online',
      payment_method: 'gcash-qr',
      payment_status: 'unpaid',
      status: 'pending',
      items: [cookieLine()],
    });

    const onlineSwitch = await request.post(`${cfg!.url}/rest/v1/rpc/kk_guest_switch_to_cash`, {
      headers,
      data: { p_order_id: onlineId },
    });
    expect(onlineSwitch.status()).toBeGreaterThanOrEqual(400);

    const dineInId = uniqueTestId('pastry-sw-di');
    await placeOrderRpc(request, {
      id: dineInId,
      channel: 'dine-in',
      branch_id: branch.id,
      table_id: table.id,
      guest_name: 'E2E Switch DI',
      payment_method: 'paymongo',
      payment_status: 'unpaid',
      status: 'pending',
      items: [cookieLine()],
    });

    const diSwitch = await request.post(`${cfg!.url}/rest/v1/rpc/kk_guest_switch_to_cash`, {
      headers,
      data: { p_order_id: dineInId },
    });
    expect(diSwitch.ok()).toBeTruthy();
    const diBody = (await diSwitch.json()) as Record<string, unknown>;
    expect(diBody.payment_method).toBe('pay-at-store');
  });

  test('barista marks pastry GCash paid and advances kitchen statuses', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');

    const baristaToken = await passwordAccessToken(
      request,
      CREDS.barista.email,
      CREDS.barista.password,
    );
    test.skip(!baristaToken, 'Barista auth failed');

    const headers = { apikey: cfg!.anonKey, Authorization: `Bearer ${cfg!.anonKey}` };
    const branches = (await (
      await request.get(`${cfg!.url}/rest/v1/kk_branches?select=id&status=eq.active&limit=1`, {
        headers,
      })
    ).json()) as BranchRow[];
    const branch = branches[0];
    const tables = (await (
      await request.get(
        `${cfg!.url}/rest/v1/kk_tables?select=id,label,branch_id&active=eq.true&branch_id=eq.${branch.id}&limit=1`,
        { headers },
      )
    ).json()) as TableRow[];
    const table = tables[0];
    test.skip(!branch || !table, 'Need branch/table');

    const orderId = uniqueTestId('pastry-barista');
    const placed = await placeOrderRpc(request, {
      id: orderId,
      channel: 'dine-in',
      branch_id: branch.id,
      table_id: table.id,
      guest_name: 'E2E Barista Pastry',
      payment_method: 'gcash-qr',
      payment_status: 'unpaid',
      status: 'pending',
      items: [cookieLine()],
    });
    expect(placed.status).toBe(200);

    const staffHeaders = {
      apikey: cfg!.anonKey,
      Authorization: `Bearer ${baristaToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };

    const markPaid = await request.patch(`${cfg!.url}/rest/v1/kk_orders?id=eq.${orderId}`, {
      headers: staffHeaders,
      data: { payment_status: 'paid', status: 'accepted' },
    });
    expect(markPaid.ok()).toBeTruthy();

    for (const status of ['preparing', 'ready', 'completed'] as const) {
      const patch = await request.patch(`${cfg!.url}/rest/v1/kk_orders?id=eq.${orderId}`, {
        headers: staffHeaders,
        data: { status },
      });
      expect(patch.ok(), `status ${status}`).toBeTruthy();
    }

    const tracked = await trackOrderRpc(request, orderId);
    expect(tracked[0]?.status).toBe('completed');
    expect(tracked[0]?.payment_status).toBe('paid');
  });

  test('customer paymongo pastry order places unpaid; cannot self-mark paid', async ({
    request,
  }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');

    const token = await customerAccessToken(request);
    test.skip(!token, 'Customer auth failed');

    const headers = { apikey: cfg!.anonKey, Authorization: `Bearer ${cfg!.anonKey}` };
    const branches = (await (
      await request.get(`${cfg!.url}/rest/v1/kk_branches?select=id&status=eq.active&limit=1`, {
        headers,
      })
    ).json()) as BranchRow[];
    const branch = branches[0];
    test.skip(!branch, 'Need branch');

    const orderId = uniqueTestId('pastry-cust-pm');
    const placed = await placeOrderRpc(
      request,
      {
        id: orderId,
        channel: 'online',
        branch_id: branch.id,
        payment_method: 'paymongo',
        payment_status: 'unpaid',
        status: 'pending',
        items: [kukiBoxLine({ cookie_blondie: 4 })],
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
      data: { payment_status: 'paid' },
    });
    const tracked = await trackOrderRpc(request, orderId);
    expect(tracked[0]?.payment_status).toBe('unpaid');
    // Either HTTP error or silent RLS no-op — must not become paid
    if (forge.ok()) {
      const rows = (await forge.json()) as Record<string, unknown>[];
      if (Array.isArray(rows) && rows[0]) {
        expect(rows[0].payment_status).not.toBe('paid');
      }
    }
  });
});
