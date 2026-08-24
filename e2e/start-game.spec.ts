import { test, expect } from "@playwright/test";
import { mockAiRoundGeneration, DEFAULT_TEST_PLAYERS } from "./fixtures";

test.describe("Start a game", () => {
  test("players can be entered and the game starts successfully", async ({
    page,
  }) => {
    await mockAiRoundGeneration(page);

    await page.goto("/setup");
    await page.getByRole("button", { name: /continue/i }).click();
    await page.waitForURL("**/players");

    for (const player of DEFAULT_TEST_PLAYERS) {
      await page.getByLabel("Player name").fill(player.name);
      await page.getByRole("button", { name: /add player/i }).click();
      await expect(page.getByText(player.name)).toBeVisible();
    }

    await page
      .getByRole("button", { name: /continue to round preparation/i })
      .click();

    // Round Preparation screen appears (word/hint generation, then role
    // assignment) and lands on the pass-the-phone flow once ready.
    await page.waitForURL("**/pass", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/pass$/);
  });

  test("imposter count can be selected before starting", async ({ page }) => {
    await mockAiRoundGeneration(page);

    await page.goto("/setup");
    // Double Trouble (2 imposters) requires 5+ players -- selecting it
    // here only checks that the mode selector itself works; the actual
    // 5-player minimum is exercised in multi-imposter.spec.ts.
    await page.getByRole("radio", { name: /double trouble/i }).click();
    await expect(
      page.getByRole("radio", { name: /double trouble/i }),
    ).toHaveAttribute("aria-checked", "true");
  });
});
