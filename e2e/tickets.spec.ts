import { test, expect, type APIRequestContext } from '@playwright/test';
import { CREDS, internalLogin, passwordAccessToken, supabaseAnonConfig, trackPageErrors, uniqueTestId } from './helpers';

/** Support tickets: barista submits with screenshot, admin resolves, screenshot object is deleted. */

const GH_BARISTA = { email: 'barista-greenhills@kadokohi.com', password: CREDS.barista.password };
const GH_STAFF = { email: 'staff-greenhills@kadokohi.com', password: CREDS.staff.password };
const BUCKET = 'kado-ticket-images';
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

type Cfg = { url: string; anonKey: string };
type TicketRow = { id: string; status: string; image_path: string | null; read_at: string | null; branch_id: string | null; reporter_role: string };

const headers = (cfg: Cfg, token: string) => ({
  apikey: cfg.anonKey,
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
});

async function token(request: APIRequestContext, creds: { email: string; password: string }) {
  const t = await passwordAccessToken(request, creds.email, creds.password);
  expect(t, `sign-in ${creds.email}`).toBeTruthy();
  return t!;
}

/** Reads storage metadata (DB), not the CDN-cached object, so deletes are visible immediately. */
async function objectExists(request: APIRequestContext, cfg: Cfg, tok: string, path: string): Promise<boolean> {
  const slash = path.lastIndexOf('/');
  const res = await request.post(`${cfg.url}/storage/v1/object/list/${BUCKET}`, {
    headers: headers(cfg, tok),
    data: { prefix: path.slice(0, slash), search: path.slice(slash + 1), limit: 10 },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const rows = (await res.json()) as { name: string }[];
  return rows.some((r) => r.name === path.slice(slash + 1));
}

async function ticketsByTitle(request: APIRequestContext, cfg: Cfg, tok: string, title: string): Promise<TicketRow[]> {
  const res = await request.get(
    `${cfg.url}/rest/v1/kk_support_tickets?select=*&title=eq.${encodeURIComponent(title)}`,
    { headers: headers(cfg, tok) },
  );
  expect(res.ok(), await res.text()).toBeTruthy();
  return res.json();
}

test.describe('support tickets', () => {
  test.setTimeout(180_000);

  test('barista ticket with screenshot → admin resolves → screenshot deleted', async ({ page, request, browser }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');
    const title = uniqueTestId('E2E ticket');
    const errors = trackPageErrors(page);
    const adminTok = await token(request, CREDS.admin);
    let ticketId: string | null = null;

    try {
      await internalLogin(page, 'barista', GH_BARISTA);
      await page.goto('/barista/tickets');
      await page.getByLabel('Title').fill(title);
      await page.getByRole('button', { name: 'App bug' }).click();
      await page.getByLabel('What happened?').fill('POS froze after tapping Pay & Place (automated test).');
      await page.locator('#ticket-image').setInputFiles({ name: 'shot.png', mimeType: 'image/png', buffer: PNG_1PX });
      await expect(page.getByAltText('Screenshot preview')).toBeVisible();
      await page.getByRole('button', { name: /send ticket/i }).click();
      await expect(page.getByText('Sent. It is now in the admin ticket list.')).toBeVisible({ timeout: 20_000 });
      await expect(page.locator('li', { hasText: title }).getByText('New', { exact: true })).toBeVisible();

      const [row] = await ticketsByTitle(request, cfg!, adminTok, title);
      expect(row, 'ticket row').toBeTruthy();
      ticketId = row.id;
      expect(row.branch_id).toBe('branch_greenhills');
      expect(row.reporter_role).toBe('barista');
      expect(row.image_path).toBeTruthy();
      const imagePath = row.image_path!;
      expect(await objectExists(request, cfg!, adminTok, imagePath)).toBe(true);

      // Another barista cannot see it, and baristas cannot change status.
      const mkTok = await token(request, CREDS.barista);
      expect(await ticketsByTitle(request, cfg!, mkTok, title)).toHaveLength(0);
      const ghTok = await token(request, GH_BARISTA);
      const selfPatch = await request.patch(`${cfg!.url}/rest/v1/kk_support_tickets?id=eq.${ticketId}`, {
        headers: headers(cfg!, ghTok),
        data: { status: 'resolved' },
      });
      expect(await selfPatch.json()).toHaveLength(0);

      // Admin resolves from the UI.
      const adminCtx = await browser.newContext();
      const admin = await adminCtx.newPage();
      await internalLogin(admin, 'admin');
      await admin.goto('/admin/tickets');
      await admin.getByRole('button', { name: new RegExp(title) }).click();
      const sheet = admin.getByRole('dialog');
      await expect(sheet.getByAltText(/Screenshot for/)).toBeVisible({ timeout: 20_000 });
      await sheet.getByLabel(/Reply to barista/).fill('Fixed in the latest release.');
      admin.once('dialog', (d) => void d.accept());
      await sheet.getByRole('button', { name: /^resolve$/i }).click();
      await expect(sheet.getByText('Resolved', { exact: true })).toBeVisible({ timeout: 20_000 });
      await expect(sheet.getByText(/screenshot was deleted/i)).toBeVisible();
      await adminCtx.close();

      const [after] = await ticketsByTitle(request, cfg!, adminTok, title);
      expect(after.status).toBe('resolved');
      expect(after.image_path).toBeNull();
      expect(after.read_at).toBeTruthy();
      expect(await objectExists(request, cfg!, adminTok, imagePath)).toBe(false);

      // Reporter sees the reply and the resolved status.
      await page.reload();
      const mine = page.locator('li', { hasText: title });
      await expect(mine.getByText('Resolved', { exact: true })).toBeVisible({ timeout: 20_000 });
      await expect(mine.getByText('Fixed in the latest release.')).toBeVisible();
      expect(errors()).toEqual([]);
    } finally {
      if (ticketId) {
        await request.delete(`${cfg!.url}/rest/v1/kk_support_tickets?id=eq.${ticketId}`, { headers: headers(cfg!, adminTok) });
      }
    }
  });

  test('staff can file a ticket; reporter fields are set by the server', async ({ request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');
    const staffTok = await token(request, GH_STAFF);
    const adminTok = await token(request, CREDS.admin);
    const title = uniqueTestId('E2E staff ticket');
    const res = await request.post(`${cfg!.url}/rest/v1/kk_support_tickets`, {
      headers: headers(cfg!, staffTok),
      data: { title, description: 'Spoof attempt', reporter_role: 'admin', status: 'resolved', branch_id: 'branch_marikina' },
    });
    expect(res.status(), await res.text()).toBe(201);
    const [row] = (await res.json()) as TicketRow[];
    try {
      expect(row.reporter_role).toBe('staff');
      expect(row.status).toBe('open');
      expect(row.branch_id).toBe('branch_greenhills');
    } finally {
      await request.delete(`${cfg!.url}/rest/v1/kk_support_tickets?id=eq.${row.id}`, { headers: headers(cfg!, adminTok) });
    }
  });
});
