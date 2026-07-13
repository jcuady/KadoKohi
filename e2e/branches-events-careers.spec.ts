import { test, expect, type Page } from '@playwright/test';
import {
  dismissCookieConsent,
  internalLogin,
  supabaseAnonConfig,
  supabaseGet,
  trackPageErrors,
  uniqueTestId,
} from './helpers';

type BranchRow = { id: string; slug: string; name: string; status: string };

async function fetchBranches(request: Parameters<typeof supabaseGet>[0]): Promise<BranchRow[]> {
  const rows = await supabaseGet<BranchRow[]>(
    request,
    'kk_branches?select=id,slug,name,status&order=name.asc',
  );
  return rows ?? [];
}

async function fillCareerApplyForm(dialog: ReturnType<Page['getByRole']>, marker: string) {
  await dialog.locator('input[autocomplete="name"]').fill(`QA Applicant ${marker}`);
  await dialog.locator('input[type="tel"]').fill('9171234567');
  await dialog.locator('input[type="email"]').fill(`qa+${marker}@example.com`);

  const availability = dialog.locator('select').first();
  await expect(availability).toBeVisible();
  await availability.selectOption('Full-time');

  const why = dialog.locator('textarea').first();
  await expect(why).toBeVisible();
  await why.fill('E2E career application — please ignore. Testing apply → admin inbox flow.');
}

test.describe('Public branches', () => {
  test('lists branches from Supabase with hero and directions', async ({ page, request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');

    const branches = await fetchBranches(request);
    test.skip(branches.length === 0, 'No branches in database');

    const errors = trackPageErrors(page);
    await page.goto('/branches');
    await dismissCookieConsent(page);

    await expect(page.getByRole('heading', { name: /kado coffee — marikina/i })).toBeVisible();

    for (const branch of branches) {
      await expect(page.getByRole('heading', { name: branch.name, exact: true })).toBeVisible({
        timeout: 20000,
      });
    }

    const directions = page.getByRole('link', { name: /get directions/i }).first();
    await expect(directions).toBeVisible();
    await expect(directions).toHaveAttribute('href', /google\.com\/maps/);

    expect(errors(), `uncaught errors: ${errors().join(' | ')}`).toEqual([]);
  });
});

test.describe('Events × branches', () => {
  test('events page shows a filter chip for every active branch', async ({ page, request }) => {
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');

    const branches = await fetchBranches(request);
    const active = branches.filter((b) => b.status === 'active');
    test.skip(active.length === 0, 'No active branches');

    const errors = trackPageErrors(page);
    await page.goto('/events');
    await dismissCookieConsent(page);

    await expect(page.getByRole('heading', { name: 'Kado Coffee Events', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /^all branches$/i })).toBeVisible();

    for (const branch of active) {
      await expect(page.getByRole('button', { name: branch.name, exact: true })).toBeVisible({
        timeout: 20000,
      });
    }

    const target = active[0]!;
    await page.getByRole('button', { name: target.name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`[?&]branch=${encodeURIComponent(target.slug)}`));

    await page.getByRole('button', { name: /^all branches$/i }).click();
    await expect(page).not.toHaveURL(/[?&]branch=/);

    expect(errors(), `uncaught errors: ${errors().join(' | ')}`).toEqual([]);
  });

  test('admin events page loads without errors', async ({ page }) => {
    const errors = trackPageErrors(page);
    await internalLogin(page, 'admin');
    await page.goto('/admin/events');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20000 });
    expect(errors(), `uncaught errors: ${errors().join(' | ')}`).toEqual([]);
  });
});

test.describe('Careers apply → admin inbox', () => {
  test('guest can apply and admin receives the application', async ({ page }) => {
    test.setTimeout(90_000);
    const cfg = supabaseAnonConfig();
    test.skip(!cfg, 'Supabase env not configured');

    const marker = uniqueTestId('career');
    const applicantEmail = `qa+${marker}@example.com`;
    const errors = trackPageErrors(page);

    await page.goto('/careers');
    await dismissCookieConsent(page);

    await expect(page.getByRole('heading', { name: /build the tambayan/i })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole('heading', { name: /^barista$/i }).first()).toBeVisible({
      timeout: 20000,
    });

    await page.getByRole('button', { name: /easy apply/i }).first().click();
    const dialog = page.getByRole('dialog', { name: /apply to kado kohi/i });
    await expect(dialog).toBeVisible();

    await fillCareerApplyForm(dialog, marker);
    await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes('kk_submit_career_application') &&
          (res.status() === 200 || res.status() === 201),
        { timeout: 30000 },
      ).catch(() => null),
      dialog.getByRole('button', { name: /apply now|submit/i }).click(),
    ]);

    // Success retitles the dialog (aria-labelledby → "Application sent").
    const successDialog = page.getByRole('dialog', { name: /application sent/i });
    await expect(successDialog).toBeVisible({ timeout: 30000 });
    await successDialog.locator('button.bg-kado-red', { hasText: /^Close$/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await internalLogin(page, 'admin');
    await page.goto('/admin/careers');
    await expect(page.getByRole('heading', { name: /^careers$/i })).toBeVisible({ timeout: 20000 });

    await page.getByRole('tab', { name: /applications/i }).click();
    await expect(page.getByRole('heading', { name: /^applications$/i })).toBeVisible({
      timeout: 15000,
    });

    const search = page.getByPlaceholder(/search applicants/i);
    await search.fill(applicantEmail);
    await expect(page.getByText(applicantEmail)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(new RegExp(`QA Applicant ${marker}`, 'i'))).toBeVisible();

    expect(errors(), `uncaught errors: ${errors().join(' | ')}`).toEqual([]);
  });

  test('admin careers jobs tab supports add-job menu', async ({ page }) => {
    const errors = trackPageErrors(page);
    await internalLogin(page, 'admin');
    await page.goto('/admin/careers');

    await expect(page.getByRole('button', { name: /publish careers page/i })).toBeEnabled({
      timeout: 20000,
    });
    await page.getByRole('tab', { name: /^jobs/i }).click();
    await page.getByRole('button', { name: /add job/i }).click();
    await expect(page.getByRole('button', { name: /blank listing/i })).toBeVisible();
    await page.getByRole('button', { name: /blank listing/i }).click();
    await expect(page.getByText(/^title$/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /^cancel$/i })).toBeVisible();

    expect(errors(), `uncaught errors: ${errors().join(' | ')}`).toEqual([]);
  });
});
