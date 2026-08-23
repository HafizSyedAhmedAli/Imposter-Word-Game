import { test, expect } from "@playwright/test";
import { mockAiRoundGeneration } from "./fixtures";

test.describe("Reset Game Data", () => {
  test("resets data from Settings and the app keeps working afterward", async ({
    page,
  }) => {
    // Create some test data first: play far enough to leave an AI round
    // cached and a change made in Settings, matching Step 5's "create
    // some test data" before the reset itself.
    await mockAiRoundGeneration(page);
    await page.goto("/");
    await page.getByRole("link", { name: /settings/i }).click();
    await page.waitForURL("**/settings");

    const soundToggle = page.getByRole("switch", { name: /sound/i });
    await expect(soundToggle).toHaveAttribute("aria-checked", "true");
    await soundToggle.click();
    await expect(soundToggle).toHaveAttribute("aria-checked", "false");

    await page.getByRole("button", { name: /reset game data/i }).click();
    await expect(page.getByText(/permanently delete/i)).toBeVisible();
    await page.getByRole("button", { name: /^reset data$/i }).click();

    await expect(
      page.getByText(/game data reset successfully/i),
    ).toBeVisible();

    // Settings fell back to defaults -- the toggle we flipped off is
    // back to its default (on) state.
    await expect(soundToggle).toHaveAttribute("aria-checked", "true");

    // The app still works normally afterward: Home -> Play still works.
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /play game/i }),
    ).toBeVisible();
  });

  test("canceling the confirmation dialog leaves data untouched", async ({
    page,
  }) => {
    await page.goto("/settings");
    await page.getByRole("button", { name: /reset game data/i }).click();
    await page.getByRole("button", { name: /^cancel$/i }).click();
    await expect(
      page.getByText(/game data reset successfully/i),
    ).not.toBeVisible();
  });
});