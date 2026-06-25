import { test, expect } from '@playwright/test';
import { supabaseAnonConfig, uniqueTestId } from './helpers';

/**
 * Booth booking RPC contracts — calendar fetch + kk_place_booth_booking.
 * Confirmed dates are booked (not selectable); proposals still allowed on quoted days until confirmed.
 */

const cfg = supabaseAnonConfig();
const describeApi = cfg ? test.describe : test.describe.skip;

function headers() {
  return {
    apikey: cfg!.anonKey,
    Authorization: `Bearer ${cfg!.anonKey}`,
    'Content-Type': 'application/json',
  };
}

function manilaDateKey(daysFromNow: number): string {
  const manila = new Date(
    new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
    }),
  );
  const y = manila.getFullYear();
  const m = String(manila.getMonth() + 1).padStart(2, '0');
  const d = String(manila.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function findOpenFutureDate(
  request: import('@playwright/test').APIRequestContext,
  minDaysFromNow = 2,
): Promise<string> {
  for (let offset = minDaysFromNow; offset < 60; offset++) {
    const key = manilaDateKey(offset);
    const [year, month] = key.split('-').map(Number);
    const calendar = await fetchCalendar(request, year, month);
    if (
      !calendar.blockouts?.includes(key) &&
      !calendar.pending?.includes(key) &&
      !calendar.booked?.includes(key)
    ) {
      return key;
    }
  }
  throw new Error('Could not find an open future date within 60 days');
}

async function findFutureBlockout(
  request: import('@playwright/test').APIRequestContext,
): Promise<string | null> {
  const minKey = manilaDateKey(1);
  for (let offset = 0; offset < 6; offset++) {
    const probe = manilaDateKey(offset);
    const [year, month] = probe.split('-').map(Number);
    const calendar = await fetchCalendar(request, year, month);
    const futureBlock = calendar.blockouts?.find((d) => d >= minKey);
    if (futureBlock) return futureBlock;
  }
  return null;
}

function buildPayload(dateKey: string, id: string) {
  const starts = new Date(`${dateKey}T14:00:00+08:00`).toISOString();
  const ends = new Date(`${dateKey}T18:00:00+08:00`).toISOString();
  return {
    id,
    contact_name: 'QA Booth',
    contact_email: `qa+${id}@example.com`,
    contact_phone: '9171234567',
    event_name: 'QA API Event',
    occasion: 'birthday',
    guest_count: 30,
    event_date: new Date(`${dateKey}T00:00:00+08:00`).toISOString(),
    starts_at: starts,
    ends_at: ends,
    package_id: 'event_proposal',
    package_name_snapshot: 'Event Proposal',
    package_base_price_snapshot: 0,
    selected_addons: [],
    estimate_snapshot: {},
  };
}

async function placeBoothBooking(
  request: import('@playwright/test').APIRequestContext,
  payload: Record<string, unknown>,
) {
  const res = await request.post(`${cfg!.url}/rest/v1/rpc/kk_place_booth_booking`, {
    headers: headers(),
    data: { payload },
  });
  const text = await res.text();
  let body: Record<string, unknown> | string = text;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    // keep raw text
  }
  return { status: res.status(), body };
}

async function fetchCalendar(
  request: import('@playwright/test').APIRequestContext,
  year: number,
  month: number,
) {
  const res = await request.post(`${cfg!.url}/rest/v1/rpc/kk_fetch_event_calendar`, {
    headers: headers(),
    data: { p_year: year, p_month: month },
  });
  expect(res.ok()).toBe(true);
  return (await res.json()) as { blockouts?: string[]; pending?: string[]; booked?: string[] };
}

describeApi('Booth booking API', () => {
  test('kk_fetch_event_calendar returns blockouts and booked arrays', async ({ request }) => {
    const now = new Date();
    const data = await fetchCalendar(request, now.getFullYear(), now.getMonth() + 1);
    expect(Array.isArray(data.blockouts)).toBe(true);
    expect(Array.isArray(data.booked)).toBe(true);
  });

  test('should reject submissions on admin-blocked dates', async ({ request }) => {
    const blocked = await findFutureBlockout(request);
    if (!blocked) {
      test.skip(true, 'No future admin blockouts in the next 6 months');
      return;
    }

    const id = uniqueTestId('blocked');
    const result = await placeBoothBooking(request, buildPayload(blocked, id));
    expect(result.status).toBeGreaterThanOrEqual(400);
    const msg = typeof result.body === 'string' ? result.body : String(result.body.message ?? '');
    expect(msg.toLowerCase()).toMatch(/not available|blocked/);
  });

  test('should reject submissions on confirmed booked dates', async ({ request }) => {
    const now = new Date();
    const calendar = await fetchCalendar(request, now.getFullYear(), now.getMonth() + 1);
    const bookedDay = calendar.booked?.find(
      (d) => !calendar.blockouts?.includes(d) && d >= manilaDateKey(1),
    );
    if (!bookedDay) {
      test.skip(true, 'No confirmed booked days in current month');
      return;
    }

    const id = uniqueTestId('booked-day');
    const result = await placeBoothBooking(request, buildPayload(bookedDay, id));
    expect(result.status).toBeGreaterThanOrEqual(400);
    const msg = typeof result.body === 'string' ? result.body : String(result.body.message ?? '');
    expect(msg.toLowerCase()).toMatch(/already booked|not available/);
  });

  test('should accept proposals on open future dates', async ({ request }) => {
    const dateKey = await findOpenFutureDate(request);
    const id = uniqueTestId('open-day');
    const result = await placeBoothBooking(request, buildPayload(dateKey, id));
    const msg = typeof result.body === 'string' ? result.body : String(result.body.message ?? '');
    expect(result.status, msg).toBeLessThan(400);
    expect(typeof result.body === 'object' ? result.body.short_code : '').toMatch(/^BK-/);
  });
});
