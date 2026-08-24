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
  },
  projects: [
    // Desktop browsers forced into mobile viewports for pass-the-phone gameplay
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 420, height: 900 },
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 420, height: 900 },
      },
    },
    // True mobile emulators (includes touch screen emulation)
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
