import { test, expect } from '@playwright/test';
import {
  customerAccessToken,
  placeOrderRpc,
  supabaseAnonConfig,
  supabaseGet,
  trackOrderRpc,
  uniqueTestId,
} from './helpers';

type BranchRow = { id: string; name: string };
type TableRow = { id: string; label: string; branch_id: string };
type MerchRow = { id: string; name: string };
type ProductRow = { id: string; name: string };
type SettingsRow = { gcash_qr_image: string | null; tax_rate: number };

test.describe('Transactional flows (Supabase kk_place_order)', () => {
  test('merch catalog is readable by anon', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured for API tests');

    const categories = await supabaseGet<{ id: string }[]>(
      request,
      'kk_merch_categories?select=id&visible=eq.true',
    );
    const products = await supabaseGet<MerchRow[]>(
      request,
      'kk_merch_products?select=id,name&visible=eq.true&order=sort_order.asc',
    );

    expect((categories ?? []).length, 'seeded merch categories').toBeGreaterThan(0);
    expect((products ?? []).length, 'seeded merch products').toBeGreaterThan(0);
    expect(products?.some((p) => p.id === 'merch_tee_classic')).toBeTruthy();
  });

  test('global GCash QR is configured in app settings', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured for API tests');

    const rows = await supabaseGet<SettingsRow[]>(
      request,
      'kk_app_settings?select=gcash_qr_image,tax_rate&id=eq.true',
    );
    const settings = rows?.[0];
    expect(settings?.gcash_qr_image, 'admin GCash QR must be set for all GCash checkouts').toBeTruthy();
    expect(String(settings?.gcash_qr_image).length).toBeGreaterThan(20);
  });

  test('anon takeout order is accepted via kk_place_order', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured for API tests');

    const branches = await supabaseGet<BranchRow[]>(
      request,
      'kk_branches?select=id,name&status=eq.active&limit=1',
    );
    const products = await supabaseGet<ProductRow[]>(
      request,
      'kk_products?select=id&visible=eq.true&limit=1',
    );
    const branch = branches?.[0];
    const product = products?.[0];
    test.skip(!branch || !product, 'Need active branch and product seed data');

    const orderId = uniqueTestId('e2e-takeout');
    const { status, body } = await placeOrderRpc(request, {
      id: orderId,
      channel: 'takeout',
      branch_id: branch.id,
      guest_name: 'E2E Takeout Guest',
      status: 'pending',
      payment_status: 'unpaid',
      items: [{ id: uniqueTestId('line'), product_id: product.id, qty: 1, item_type: 'coffee' }],
    });

    expect(status).toBe(200);
    expect(typeof body).toBe('object');
    expect((body as Record<string, unknown>).channel).toBe('takeout');
    expect((body as Record<string, unknown>).guest_name).toBe('E2E Takeout Guest');
  });

  test('anon dine-in order uses table label when guest name omitted', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured for API tests');

    const branches = await supabaseGet<BranchRow[]>(
      request,
      'kk_branches?select=id&status=eq.active&limit=1',
    );
    const branch = branches?.[0];
    test.skip(!branch, 'Need active branch seed data');

    const tables = await supabaseGet<TableRow[]>(
      request,
      `kk_tables?select=id,label,branch_id&active=eq.true&branch_id=eq.${branch.id}&limit=1`,
    );
    const products = await supabaseGet<ProductRow[]>(
      request,
      'kk_products?select=id&visible=eq.true&limit=1',
    );
    const table = tables?.[0];
    const product = products?.[0];
    test.skip(!table || !product, 'Need active table and product seed data');

    const orderId = uniqueTestId('e2e-dinein');
    const { status, body } = await placeOrderRpc(request, {
      id: orderId,
      channel: 'dine-in',
      branch_id: branch.id,
      table_id: table.id,
      status: 'pending',
      payment_status: 'unpaid',
      items: [{ id: uniqueTestId('line'), product_id: product.id, qty: 1, item_type: 'coffee' }],
    });

    expect(status).toBe(200);
    expect((body as Record<string, unknown>).guest_name).toBe(table.label);

    const tracked = await trackOrderRpc(request, orderId);
    expect(tracked.length).toBe(1);
    expect(tracked[0].status).toBe('pending');
    expect(tracked[0].channel).toBe('dine-in');
  });

  test('customer merch order is accepted with GCash payment method', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured for API tests');

    const token = await customerAccessToken(request);
    test.skip(!token, 'Could not authenticate customer test account');

    const branches = await supabaseGet<BranchRow[]>(
      request,
      'kk_branches?select=id&status=eq.active&limit=1',
    );
    const merch = await supabaseGet<MerchRow[]>(
      request,
      'kk_merch_products?select=id&visible=eq.true&limit=1',
    );
    const branch = branches?.[0];
    const product = merch?.[0];
    test.skip(!branch || !product, 'Need active branch and merch product seed data');

    const orderId = uniqueTestId('e2e-merch');
    const { status, body } = await placeOrderRpc(
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
            id: uniqueTestId('line'),
            product_id: product.id,
            qty: 1,
            item_type: 'merch',
            merch_variants: [{ groupName: 'Size', optionLabel: 'M', priceDelta: 0 }],
          },
        ],
      },
      token,
    );

    expect(status).toBe(200);
    expect((body as Record<string, unknown>).channel).toBe('merch');
    expect((body as Record<string, unknown>).payment_method).toBe('gcash-qr');
    expect((body as Record<string, unknown>).customer_id).toBeTruthy();

    const tracked = await trackOrderRpc(request, orderId);
    expect(tracked.length).toBe(1);
    expect(tracked[0].channel).toBe('merch');
  });
});
