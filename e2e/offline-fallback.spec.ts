import { test, expect } from "@playwright/test";
import { mockAiRoundGenerationFailure } from "./fixtures";

/**
 * Exercises the fallback chain by making the AI call fail at the
 * network layer (page.route abort), exactly as Step 7 of the task
 * brief specifies -- never by toggling Playwright's real offline mode
 * against a live AI provider, and never against the real API.
 */
test.describe("Offline / AI-unavailable fallback", () => {
  test("the game remains fully playable when AI round generation fails", async ({
    page,
  }) => {
    await mockAiRoundGenerationFailure(page);

    await page.goto("/setup");
    await page.getByRole("button", { name: /continue/i }).click();
    await page.waitForURL("**/players");

    for (const name of ["Ahmed", "Asmed", "Mali"]) {
      await page.getByLabel("Player name").fill(name);
      await page.getByRole("button", { name: /add player/i }).click();
    }

    await page
      .getByRole("button", { name: /continue to round preparation/i })
      .click();

    // Round Preparation falls through to the static fallback word list
    // (game/game-engine.ts tier 3) and still reaches the pass-the-phone
    // screen -- the round is never blocked on AI availability.
    await page.waitForURL("**/pass", { timeout: 15_000 });
    await expect(page.getByText(/pass the phone to/i)).toBeVisible();
  });
});