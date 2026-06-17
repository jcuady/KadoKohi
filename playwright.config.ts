import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright e2e config. Builds the production bundle and serves it with
 * `vite preview`, then runs smoke tests against desktop + mobile viewports.
 * Run with: npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Cap parallelism: many specs sign in to the same Supabase accounts, and a
  // large worker pool can trip GoTrue auth throttling and cause flaky hangs.
  workers: process.env.CI ? 1 : 3,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-pixel', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
