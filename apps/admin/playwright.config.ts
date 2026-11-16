import { defineConfig, devices } from '@playwright/test';

/**
 * Admin dashboard browser tests: the static export served locally, connected to all Firebase
 * emulators (auth, firestore, storage, functions). Run with `npm run test:e2e:admin` at the repo root.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:3200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'te-IN',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: 'node ../../scripts/serve-static.mjs out 3200',
    url: 'http://127.0.0.1:3200/login/',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
