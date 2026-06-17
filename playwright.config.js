import { defineConfig, devices } from '@playwright/test';

// E2E config for the scheduling harness (spec §10.3 — T-E two-zone booking).
//
// Default: hermetic local run. Playwright builds + previews the app with BOTH
// scheduling flags ON (via webServer.env, since the repo .env leaves them off),
// so /BookingCalendar mounts the instant-booking surface. The booking RPCs are
// intercepted in the test, so NO real backend write happens.
//
// Override: set E2E_BASE_URL (e.g. the deployed prod URL, which is already
// flagged on) to run against an external server and skip the local webServer.

const externalBaseURL = process.env.E2E_BASE_URL;
const baseURL = externalBaseURL || 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  ...(externalBaseURL
    ? {}
    : {
        webServer: {
          command: 'npm run build && npm run preview -- --port 4173 --strictPort',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
          env: {
            ...process.env,
            VITE_SCHEDULING_RULES: '1',
            VITE_INSTANT_BOOKING: '1',
            // The booking RPCs are intercepted in the test (matched by PATH, any
            // host), so these only need to be NON-EMPTY for supabaseClient to
            // construct (it throws on missing env). Locally the real .env
            // supplies them; in CI (.env is gitignored) these dummy fallbacks
            // keep the build from throwing while NO real backend is contacted.
            VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://e2e.supabase.co',
            VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'e2e-anon-key',
            VITE_BASE44_APP_ID: process.env.VITE_BASE44_APP_ID || 'e2e-app',
          },
        },
      }),
});
