import { test, expect } from '@playwright/test';
import { internalLogin, trackPageErrors } from './helpers';

const RESET_CARD_LABELS = [
  'Reset transactional data',
  'Reset orders only',
  'Reset booth bookings',
  'Reset loyalty activity',
  'Reset customer accounts',
  'Reset all data (nuclear)',
];

test.describe('Admin settings operational writes', () => {
  test('settings save flash and reset phrase validation without destructive confirm', async ({ page }) => {
    const errors = trackPageErrors(page);
    await internalLogin(page, 'admin');
    await page.goto('/admin/settings');
    await expect(page.getByRole('heading', { name: /^settings$/i })).toBeVisible({ timeout: 20000 });

    const taxInput = page.getByText('Tax rate (%)').locator('..').locator('input[type="number"]');
    await expect(taxInput).toBeVisible({ timeout: 20000 });
    const original = await taxInput.inputValue();
    const bumped = Math.min(100, Number(original) + 0.01);
    await taxInput.fill(String(bumped));
    await expect(page.getByText(/saved to database/i)).toBeVisible({ timeout: 20000 });
    await taxInput.fill(original);
    await expect(page.getByText(/saved to database/i)).toBeVisible({ timeout: 20000 });

    await expect(page.getByRole('heading', { name: /danger zone/i })).toBeVisible();
    for (const label of RESET_CARD_LABELS) {
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
    }

    await page.getByRole('button', { name: 'Reset orders only' }).click();
    const phraseInput = page.getByPlaceholder('RESET ORDERS');
    await expect(phraseInput).toBeVisible();
    await phraseInput.fill('WRONG PHRASE');
    await expect(page.getByRole('button', { name: /confirm reset/i })).toBeDisabled();

    await phraseInput.fill('RESET ORDERS');
    await expect(page.getByRole('button', { name: /confirm reset/i })).toBeEnabled();
    expect(errors(), `uncaught errors: ${errors().join(' | ')}`).toEqual([]);
  });
});
