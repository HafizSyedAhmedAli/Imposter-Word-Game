import { test, expect } from "@playwright/test";
import { startGameWithPlayers, DEFAULT_TEST_PLAYERS } from "./fixtures";

/**
 * The 2s reveal hold in PlayerRevealCard/ImposterRevealCard (see those
 * components' REVEAL_HOLD_MS / CREW_REVEAL_DELAY_MS) is a deliberate
 * gameplay requirement -- it exists so the "HIDE & PASS PHONE" button
 * can't be tapped instantly by either role, which would itself leak who
 * the imposter is via timing. This test waits for the button to become
 * enabled rather than asserting on the exact millisecond, per Step 5's
 * "do not make the test fragile by checking arbitrary CSS animations."
 */
async function passOnePlayer(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /^i'm ready$/i }).click();
  await page.getByRole("button", { name: /reveal my role/i }).click();

  const hideButton = page.getByRole("button", { name: /hide & pass phone/i });
  await expect(hideButton).toBeEnabled({ timeout: 5_000 });
  await hideButton.click();
}

test.describe("Secret reveal (pass-the-phone)", () => {
  test("every player receives a role and the flow ends on All Players Ready", async ({
    page,
  }) => {
    await startGameWithPlayers(page);

    for (let i = 0; i < DEFAULT_TEST_PLAYERS.length; i++) {
      await expect(
        page.getByText(`Pass the phone to`, { exact: false }),
      ).toBeVisible();

      await page.getByRole("button", { name: /^i'm ready$/i }).click();
      await page.getByRole("button", { name: /reveal my role/i }).click();

      // Exactly one of the two role cards renders -- never both, and
      // never neither.
      const crewCard = page.getByText("YOU'RE A PLAYER", { exact: false });
      const imposterCard = page.getByText("YOU'RE THE IMPOSTER", {
        exact: false,
      });
      await expect(crewCard.or(imposterCard)).toBeVisible();

      const hideButton = page.getByRole("button", {
        name: /hide & pass phone/i,
      });
      await expect(hideButton).toBeEnabled({ timeout: 5_000 });
      await hideButton.click();
    }

    await expect(
      page.getByText("ALL PLAYERS READY", { exact: false }),
    ).toBeVisible();
  });

  test("starting discussion navigates to the discussion screen", async ({
    page,
  }) => {
    await startGameWithPlayers(page);

    for (let i = 0; i < DEFAULT_TEST_PLAYERS.length; i++) {
      await passOnePlayer(page);
    }

    await page.getByRole("button", { name: /start discussion/i }).click();
    await page.waitForURL("**/game");
    await expect(page).toHaveURL(/\/game$/);
  });
});
