import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests against a production build connected to the Firebase emulators.
 * Run through `npm run test:e2e` at the repo root, which starts emulators and seeds test data.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: 'npx next start -p 3100',
    url: 'http://127.0.0.1:3100/te',
    reuseExistingServer: false,
    timeout: 120_000,
    env: { NEXT_PUBLIC_USE_FIREBASE_EMULATORS: 'true' },
  },
});
