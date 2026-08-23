import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against a real `next dev`/`next start` server (see `webServer`
 * below) -- never against the deployed AI API. Every test that would
 * otherwise hit /api/round/generate intercepts that route with
 * `page.route()` instead (see e2e/fixtures.ts), so the whole suite runs
 * fully offline-of-the-internet and deterministically, matching Step 8
 * of the task brief ("tests must not randomly fail").
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    // Every screen this app renders assumes touch/mobile-first layout
    // (pass-the-phone gameplay) -- a small viewport is closer to how
    // this app is actually used than the Playwright default.
    viewport: { width: 420, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
