import { test, expect } from '@playwright/test';
import { internalLogin, trackPageErrors } from './helpers';

test.describe('Staff operational writes', () => {
  test('staff can advance a merch order when payment allows', async ({ page }) => {
    const errors = trackPageErrors(page);
    await internalLogin(page, 'staff');
    await page.goto('/staff/merch-orders');
    await expect(page.getByRole('heading', { name: /merch orders/i })).toBeVisible({ timeout: 20000 });

    const advanceBtn = page.getByRole('button', { name: /^→ / }).first();
    const hasAdvance = await advanceBtn.isVisible({ timeout: 15000 }).catch(() => false);
    test.skip(!hasAdvance, 'No merch order ready for status advance (needs settled payment)');

    const btnText = (await advanceBtn.textContent()) ?? '';
    const targetStatus = btnText.replace(/^→\s*/, '').trim();

    await advanceBtn.click();
    await expect(page.locator('.fixed.bottom-4').filter({ hasText: /failed/i })).toHaveCount(0, {
      timeout: 5000,
    });
    await expect(page.getByText(targetStatus, { exact: true }).first()).toBeVisible({ timeout: 15000 });
    expect(errors(), `uncaught errors: ${errors().join(' | ')}`).toEqual([]);
  });
});
