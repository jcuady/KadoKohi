import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  CREDS,
  dismissCookieConsent,
  internalLogin,
  passwordAccessToken,
  placeOrderRpc,
  supabaseAnonConfig,
  trackOrderRpc,
  trackPageErrors,
  uniqueTestId,
} from './helpers';

/** Greenhills branch readiness: its own barista account, branch isolation, POS, and guest surfaces. */

const GH = 'branch_greenhills';
const MK = 'branch_marikina';
const GH_BARISTA = { email: 'barista-greenhills@kadokohi.com', password: CREDS.barista.password };

type Cfg = { url: string; anonKey: string };

function authHeaders(cfg: Cfg, token: string) {
  return {
    apikey: cfg.anonKey,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function signIn(request: APIRequestContext, email: string, password: string): Promise<string> {
  const token = await passwordAccessToken(request, email, password);
  expect(token, `sign-in for ${email}`).toBeTruthy();
  return token!;
}

async function firstTableId(request: APIRequestContext, cfg: Cfg, branchId: string): Promise<string> {
  const res = await request.get(
    `${cfg.url}/rest/v1/kk_tables?select=id&active=eq.true&branch_id=eq.${branchId}&order=code&limit=1`,
    { headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` } },
  );
  const rows = (await res.json()) as { id: string }[];
  expect(rows.length, `active table at ${branchId}`).toBeGreaterThan(0);
  return rows[0].id;
}

function coffeeLine() {
  return {
    id: uniqueTestId('line'),
    product_id: 'prod_matcha_oat',
    product_name_snapshot: 'Matcha Oat Latte',
    item_type: 'coffee',
    qty: 1,
  };
}

async function placeDineIn(request: APIRequestContext, cfg: Cfg, branchId: string): Promise<string> {
  const id = crypto.randomUUID();
  const placed = await placeOrderRpc(request, {
    id,
    channel: 'dine-in',
    branch_id: branchId,
    table_id: await firstTableId(request, cfg, branchId),
    payment_method: 'gcash-qr',
    payment_status: 'unpaid',
    status: 'pending',
    items: [coffeeLine()],
  });
  expect(placed.status, JSON.stringify(placed.body)).toBe(200);
  return id;
}

async function adminDelete(request: APIRequestContext, cfg: Cfg, adminToken: string, ids: string[]) {
  for (const id of ids) {
    await request.post(`${cfg.url}/rest/v1/rpc/kk_admin_delete_order`, {
      headers: authHeaders(cfg, adminToken),
      data: { p_order_id: id },
    });
  }
}

test.describe('Greenhills barista account', () => {
  test('profile is a Greenhills barista and cannot escalate itself', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');
    const token = await signIn(request, GH_BARISTA.email, GH_BARISTA.password);

    const me = await request.get(
      `${cfg!.url}/rest/v1/kk_profiles?select=id,role,branch_id&email=eq.${encodeURIComponent(GH_BARISTA.email)}`,
      { headers: authHeaders(cfg!, token) },
    );
    const [profile] = (await me.json()) as { id: string; role: string; branch_id: string }[];
    expect(profile).toMatchObject({ role: 'barista', branch_id: GH });

    for (const patch of [{ role: 'admin' }, { branch_id: MK }]) {
      const res = await request.patch(`${cfg!.url}/rest/v1/kk_profiles?id=eq.${profile.id}`, {
        headers: authHeaders(cfg!, token),
        data: patch,
      });
      expect(res.ok(), `escalation ${JSON.stringify(patch)} must be rejected`).toBeFalsy();
    }

    const after = await request.get(`${cfg!.url}/rest/v1/kk_profiles?select=role,branch_id&id=eq.${profile.id}`, {
      headers: authHeaders(cfg!, token),
    });
    expect((await after.json())[0]).toMatchObject({ role: 'barista', branch_id: GH });
  });

  test('branch isolation: each barista sees and works only its own branch orders', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');
    const ghToken = await signIn(request, GH_BARISTA.email, GH_BARISTA.password);
    const mkToken = await signIn(request, CREDS.barista.email, CREDS.barista.password);
    const adminToken = await signIn(request, CREDS.admin.email, CREDS.admin.password);

    const ghOrder = await placeDineIn(request, cfg!, GH);
    const mkOrder = await placeDineIn(request, cfg!, MK);
    try {
      const visible = async (token: string, id: string) => {
        const res = await request.get(`${cfg!.url}/rest/v1/kk_orders?select=id&id=eq.${id}`, {
          headers: authHeaders(cfg!, token),
        });
        return ((await res.json()) as unknown[]).length;
      };
      expect(await visible(ghToken, ghOrder), 'GH barista sees GH order').toBe(1);
      expect(await visible(ghToken, mkOrder), 'GH barista cannot see Marikina order').toBe(0);
      expect(await visible(mkToken, ghOrder), 'Marikina barista cannot see GH order').toBe(0);

      const crossPatch = await request.patch(`${cfg!.url}/rest/v1/kk_orders?id=eq.${mkOrder}`, {
        headers: authHeaders(cfg!, ghToken),
        data: { status: 'cancelled' },
      });
      expect(((await crossPatch.json()) as unknown[]).length, 'GH barista cannot update Marikina order').toBe(0);

      const markPaid = await request.patch(`${cfg!.url}/rest/v1/kk_orders?id=eq.${ghOrder}`, {
        headers: authHeaders(cfg!, ghToken),
        data: { payment_status: 'paid', status: 'accepted' },
      });
      expect(markPaid.ok(), await markPaid.text()).toBeTruthy();
      for (const status of ['preparing', 'ready', 'completed'] as const) {
        const res = await request.patch(`${cfg!.url}/rest/v1/kk_orders?id=eq.${ghOrder}`, {
          headers: authHeaders(cfg!, ghToken),
          data: { status },
        });
        expect(res.ok(), `status ${status}`).toBeTruthy();
      }
      const [tracked] = await trackOrderRpc(request, ghOrder);
      expect(tracked).toMatchObject({ status: 'completed', payment_status: 'paid', branch_id: GH });

      const [mkTracked] = await trackOrderRpc(request, mkOrder);
      expect(mkTracked?.status, 'Marikina order untouched').toBe('pending');
    } finally {
      await adminDelete(request, cfg!, adminToken, [ghOrder, mkOrder]);
    }
  });

  test('stamps: can adjust a customer balance but not rename the customer', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');
    const token = await signIn(request, GH_BARISTA.email, GH_BARISTA.password);
    const url = `${cfg!.url}/rest/v1/kk_profiles?email=eq.${encodeURIComponent(CREDS.customer.email)}`;

    const [before] = (await (
      await request.get(`${url}&select=id,name,loyalty_stamps`, { headers: authHeaders(cfg!, token) })
    ).json()) as { id: string; name: string; loyalty_stamps: number }[];
    expect(before, 'barista can look up the customer').toBeTruthy();

    try {
      const bump = await request.patch(url, {
        headers: authHeaders(cfg!, token),
        data: { loyalty_stamps: before.loyalty_stamps + 1, name: 'Renamed By Barista' },
      });
      expect(bump.ok(), await bump.text()).toBeTruthy();
      const [after] = (await bump.json()) as { name: string; loyalty_stamps: number }[];
      expect(after).toMatchObject({ loyalty_stamps: before.loyalty_stamps + 1, name: before.name });
    } finally {
      await request.patch(url, {
        headers: authHeaders(cfg!, token),
        data: { loyalty_stamps: before.loyalty_stamps },
      });
    }
  });

  test('portal login lands on a Greenhills-labelled board and every barista route renders', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = trackPageErrors(page);
    await internalLogin(page, 'barista', GH_BARISTA);
    await expect(page.getByText(/greenhills/i).first()).toBeVisible({ timeout: 20000 });

    for (const route of ['/barista', '/barista/queue', '/barista/pos', '/barista/menu', '/barista/stamps', '/barista/settings']) {
      await page.goto(route);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
    }
    await page.goto('/barista/kiosk');
    await expect(page.getByText(/greenhills/i).first()).toBeVisible({ timeout: 20000 });
    expect(errors(), `uncaught errors: ${errors().join(' | ')}`).toEqual([]);
  });

  test('POS order is filed under Greenhills and shows in the Greenhills queue', async ({ page, request }) => {
    test.setTimeout(90_000);
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');
    const errors = trackPageErrors(page);

    await internalLogin(page, 'barista', GH_BARISTA);
    await page.goto('/barista/pos');
    await expect(page.getByRole('heading', { name: /^POS$/i })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/greenhills/i).first()).toBeVisible();

    await page.locator('.grid.sm\\:grid-cols-2.gap-3 button').first().click();
    const modal = page.locator('.fixed.inset-0').filter({ hasText: /select variants/i });
    await expect(modal).toBeVisible({ timeout: 10000 });
    await modal.getByRole('button', { name: /^Add/i }).click();
    await expect(modal).toHaveCount(0, { timeout: 10000 });

    await page.getByRole('button', { name: /place order/i }).click();
    const banner = page.getByText(/order .+ placed/i);
    await expect(banner).toBeVisible({ timeout: 20000 });
    const shortCode = ((await banner.textContent()) ?? '').match(/Order\s+(KK-\d+)/i)?.[1];
    expect(shortCode, 'short code in banner').toBeTruthy();

    const adminToken = await signIn(request, CREDS.admin.email, CREDS.admin.password);
    const res = await request.get(
      `${cfg!.url}/rest/v1/kk_orders?select=id,branch_id,channel&short_code=eq.${shortCode}&order=created_at.desc&limit=1`,
      { headers: authHeaders(cfg!, adminToken) },
    );
    const [order] = (await res.json()) as { id: string; branch_id: string; channel: string }[];
    try {
      expect(order).toMatchObject({ branch_id: GH, channel: 'pos' });
      await page.goto('/barista/queue');
      await expect(page.getByText(shortCode!)).toBeVisible({ timeout: 20000 });
      expect(errors(), `uncaught errors: ${errors().join(' | ')}`).toEqual([]);
    } finally {
      if (order) await adminDelete(request, cfg!, adminToken, [order.id]);
    }
  });
});

test.describe('Greenhills guest surfaces', () => {
  test('dine-in QR for a Greenhills table loads the menu', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/order/qr/gre-t01');
    await dismissCookieConsent(page);
    await expect(page.getByText(/dine-in ·/i)).toBeVisible({ timeout: 25000 });
    await expect(page.getByText(/greenhills/i).first()).toBeVisible();
    await expect(page.locator('.guest-order-product-grid button:not([disabled])').first()).toBeVisible({
      timeout: 20000,
    });
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('takeout for Greenhills loads the menu', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/order/takeout?b=greenhills');
    await dismissCookieConsent(page);
    await expect(page.getByText(/takeout ·/i)).toBeVisible({ timeout: 25000 });
    await expect(page.getByText(/greenhills/i).first()).toBeVisible();
    await expect(page.locator('.guest-order-product-grid button:not([disabled])').first()).toBeVisible({
      timeout: 20000,
    });
    expect(errors(), 'no uncaught errors').toEqual([]);
  });

  test('branches page lists Greenhills with phone and directions', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/branches');
    await dismissCookieConsent(page);
    await expect(page.getByText(/greenhills/i).first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator('a[href*="maps.app.goo.gl/uxnZNSRxFmSg84Kz7"]').first()).toBeAttached();
    await expect(page.locator('a[href^="tel:"][href*="9605779641"]').first()).toBeAttached();
    expect(errors(), 'no uncaught errors').toEqual([]);
  });
});
