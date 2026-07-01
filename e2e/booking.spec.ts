import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { dismissCookieConsent, supabaseAnonConfig, trackPageErrors, uniqueTestId } from './helpers';

const BOOKING_PATHS = ['/book/coffee-cart', '/book/matcha-bar'] as const;

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

async function fetchEventCalendar(request: APIRequestContext, year: number, month: number) {
  const cfg = supabaseAnonConfig();
  if (!cfg) throw new Error('Missing Supabase config for booking E2E');
  const res = await request.post(`${cfg.url}/rest/v1/rpc/kk_fetch_event_calendar`, {
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      'Content-Type': 'application/json',
    },
    data: { p_year: year, p_month: month },
  });
  expect(res.ok()).toBe(true);
  return (await res.json()) as { blockouts?: string[]; booked?: string[] };
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

async function findOpenFutureDate(request: APIRequestContext): Promise<string> {
  for (let offset = 2; offset < 60; offset++) {
    const key = manilaDateKey(offset);
    const [year, month] = key.split('-').map(Number);
    const calendar = await fetchEventCalendar(request, year, month);
    if (!calendar.blockouts?.includes(key)) return key;
  }
  throw new Error('Could not find an open future date within 60 days');
}

async function pickCalendarDateKey(page: Page, dateKey: string): Promise<void> {
  const [year, month] = dateKey.split('-').map(Number);
  const calendar = page.locator('#booking-form').locator('div').filter({
    has: page.getByRole('button', { name: /previous month/i }),
  });
  for (let attempt = 0; attempt < 24; attempt++) {
    const headerText = await calendar.locator('p.text-sm').filter({ hasText: /\d{4}/ }).textContent();
    const [monthName, yearStr] = (headerText ?? '').trim().split(/\s+/);
    const headerYear = Number(yearStr);
    const headerMonth = MONTH_LABELS.indexOf(monthName as (typeof MONTH_LABELS)[number]) + 1;
    if (headerYear === year && headerMonth === month) {
      const dayBtn = page.locator(`#booking-form button[aria-label^="${dateKey}"]`);
      await expect(dayBtn).toBeEnabled();
      await dayBtn.click();
      await expect(dayBtn).toHaveAttribute('aria-pressed', 'true');
      return;
    }
    const goForward = headerYear < year || (headerYear === year && headerMonth < month);
    await page.getByRole('button', { name: goForward ? /next month/i : /previous month/i }).click();
  }
  throw new Error(`Could not navigate calendar to ${dateKey}`);
}

async function scrollToWizard(page: Page): Promise<void> {
  await page.locator('#booking-form').scrollIntoViewIfNeeded();
  await expect(page.getByRole('navigation', { name: /booking progress/i })).toBeVisible();
}

function wizardField(page: Page, label: RegExp) {
  return page
    .locator('#booking-form label')
    .filter({ hasText: label })
    .locator('..')
    .locator('input, textarea, select')
    .first();
}

async function fillContactStep(page: Page, suffix: string): Promise<void> {
  await wizardField(page, /^your name$/i).fill(`QA ${suffix}`);
  await wizardField(page, /^email$/i).fill(`qa+${uniqueTestId(suffix)}@example.com`);
  await wizardField(page, /^phone$/i).fill('9171234567');
}

async function fillEventStep(page: Page, suffix: string): Promise<void> {
  await wizardField(page, /^event name$/i).fill(`QA ${suffix} Celebration`);
  await wizardField(page, /^approx\. guests$/i).fill('25');
  await wizardField(page, /^start time$/i).fill('14:00');
  await wizardField(page, /^end time$/i).fill('18:00');
}

async function pickFirstSelectableCalendarDay(
  page: Page,
  mode: 'open' | 'any' = 'any',
): Promise<string> {
  const selector =
    mode === 'open'
      ? '#booking-form button[aria-label$="available"]'
      : '#booking-form button[aria-label$="available"], #booking-form button[aria-label$="booked"]';
  for (let monthTry = 0; monthTry < 14; monthTry++) {
    const days = page.locator(selector);
    const count = await days.count();
    for (let i = 0; i < count; i++) {
      const btn = days.nth(i);
      if (!(await btn.isEnabled())) continue;
      const label = await btn.getAttribute('aria-label');
      if (!label || label.includes('blocked') || label.includes('past')) continue;
      await btn.click();
      const dateKey = label.split(' ')[0];
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
      return dateKey;
    }
    await page.getByRole('button', { name: /next month/i }).click();
  }
  throw new Error('Could not find a selectable calendar day within 14 months');
}

async function advanceThroughWizard(
  page: Page,
  request: APIRequestContext,
  suffix: string,
  dateKey?: string,
): Promise<string> {
  await fillContactStep(page, suffix);
  await page.getByRole('button', { name: /^continue$/i }).click();
  await expect(page.getByRole('heading', { name: /event details/i })).toBeVisible();

  await fillEventStep(page, suffix);
  await page.getByRole('button', { name: /^continue$/i }).click();
  await expect(page.getByRole('heading', { name: /date & package/i })).toBeVisible();

  const chosenDate = dateKey ?? (await findOpenFutureDate(request));
  await pickCalendarDateKey(page, chosenDate);
  await page.getByRole('button', { name: /^continue$/i }).click();
  await expect(page.getByRole('heading', { name: /review your proposal/i })).toBeVisible();
  return chosenDate;
}

for (const path of BOOKING_PATHS) {
  const label = path.includes('matcha') ? 'matcha bar' : 'coffee cart';
  const slug = path.includes('matcha') ? 'matcha-bar' : 'coffee-cart';

  test(`${label} booking page renders wizard without runtime errors`, async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto(path);
    await dismissCookieConsent(page);
    await scrollToWizard(page);
    await expect(page.getByRole('heading', { name: /your contact details/i })).toBeVisible();
    expect(errors(), errors().join(' | ')).toEqual([]);
  });

  test(`${label} wizard validates each step before continuing`, async ({ page }) => {
    await page.goto(path);
    await dismissCookieConsent(page);
    await scrollToWizard(page);

    await page.getByRole('button', { name: /^continue$/i }).click();
    await expect(page.getByText(/enter your name, email, and phone/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /your contact details/i })).toBeVisible();

    await fillContactStep(page, `validate-${slug}`);
    await page.getByRole('button', { name: /^continue$/i }).click();
    await expect(page.getByRole('heading', { name: /event details/i })).toBeVisible();

    await page.getByRole('button', { name: /^continue$/i }).click();
    await expect(page.getByText(/complete event details/i)).toBeVisible();

    await fillEventStep(page, `validate-${slug}`);
    await wizardField(page, /^end time$/i).fill('12:00');
    await page.getByRole('button', { name: /^continue$/i }).click();
    await expect(page.getByText(/end time is after start time/i)).toBeVisible();
  });

  test(`${label} wizard supports back navigation across steps`, async ({ page }) => {
    await page.goto(path);
    await dismissCookieConsent(page);
    await scrollToWizard(page);

    await fillContactStep(page, `back-${slug}`);
    await page.getByRole('button', { name: /^continue$/i }).click();
    await fillEventStep(page, `back-${slug}`);
    await page.getByRole('button', { name: /^continue$/i }).click();
    await expect(page.getByRole('heading', { name: /date & package/i })).toBeVisible();

    await page.getByRole('button', { name: /^back$/i }).click();
    await expect(page.getByRole('heading', { name: /event details/i })).toBeVisible();
    await expect(wizardField(page, /^event name$/i)).toHaveValue(`QA back-${slug} Celebration`);

    await page.getByRole('button', { name: /^back$/i }).click();
    await expect(page.getByRole('heading', { name: /your contact details/i })).toBeVisible();
  });

  test(`${label} full proposal flow saves booking and shows confirmation`, async ({ page, request }) => {
    test.setTimeout(60_000);
    const errors = trackPageErrors(page);
    await page.goto(path);
    await dismissCookieConsent(page);
    await scrollToWizard(page);

    const dateKey = await advanceThroughWizard(page, request, `submit-${slug}`);
    await expect(page.getByText(dateKey)).toBeVisible();

    await page.getByRole('button', { name: /^submit your proposal$/i }).click();
    await expect(page.getByRole('heading', { name: /proposal saved/i })).toBeVisible({ timeout: 45000 });
    await expect(page.locator('#booking-form').getByText(/^Reference BK-/i)).toBeVisible();
    const mailtoLink = page.getByRole('link', { name: /open email again/i });
    const teamNotified = page.getByText(/events team at kadocoffeeph@gmail.com has been notified/i);
    await expect(mailtoLink.or(teamNotified)).toBeVisible();
    if (await mailtoLink.isVisible()) {
      await expect(mailtoLink).toHaveAttribute('href', /^mailto:/i);
    }
    expect(errors(), errors().join(' | ')).toEqual([]);
  });
}

test('booked calendar days remain selectable for customers', async ({ page }) => {
  await page.goto('/book/coffee-cart');
  await dismissCookieConsent(page);
  await scrollToWizard(page);

  await fillContactStep(page, 'booked-day');
  await page.getByRole('button', { name: /^continue$/i }).click();
  await fillEventStep(page, 'booked-day');
  await page.getByRole('button', { name: /^continue$/i }).click();

  const bookedDay = page.locator('#booking-form button[aria-label$="booked"]').first();
  const hasBooked = (await bookedDay.count()) > 0;
  if (!hasBooked) {
    test.skip(true, 'No booked days in current calendar month — skipping booked-day UI check');
    return;
  }

  await expect(bookedDay).toBeEnabled();
  await bookedDay.click();
  await expect(bookedDay).toHaveAttribute('aria-pressed', 'true');
});
