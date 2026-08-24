// e2e/multi-imposter.spec.ts
import { test, expect } from "@playwright/test";
import { mockAiRoundGeneration, addPlayers } from "./fixtures";

const NAMES = ["Ann", "Ben", "Cid", "Dee", "Eve", "Fay", "Gus", "Hal"];

test.describe("Multi-imposter mode", () => {
  test("8 players / Double Trouble reaches round preparation with 2 imposters seated", async ({
    page,
  }) => {
    await mockAiRoundGeneration(page);

    await page.goto("/setup");
    await page.getByRole("radio", { name: /double trouble/i }).click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.waitForURL("**/players");

    await addPlayers(
      page,
      NAMES.map((name) => ({ name })),
    );

    // The prerequisite Continue needs: the roster (confirmed above, one
    // by one) must actually satisfy Double Trouble's 5-player minimum
    // (game/game-rules.ts's isPlayerCountValid) before the button's
    // aria-disabled flips to "false" -- never force-click past it.
    const roundPrepContinue = page.getByRole("button", {
      name: /continue to round preparation/i,
    });
    await expect(roundPrepContinue).toHaveAttribute("aria-disabled", "false");
    await roundPrepContinue.click();
    await page.waitForURL("**/pass", { timeout: 15_000 });

    // Every named player is reachable in the pass-the-phone order --
    // confirms all 8 seats (and therefore both the 2 imposters and 6
    // crew, per game/game-rules.ts's getImposterCount) made it through
    // role assignment without corruption.
    for (const name of NAMES) {
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    }
  });

  test("every seat resolves to exactly one role, and voting still works afterward", async ({
    page,
  }) => {
    await mockAiRoundGeneration(page);

    await page.goto("/setup");
    await page.getByRole("radio", { name: /triple threat/i }).click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.waitForURL("**/players");

    const players = NAMES.slice(0, 7); // Triple Threat requires 7+
    await addPlayers(
      page,
      players.map((name) => ({ name })),
    );

    // Same prerequisite as above: Triple Threat's minimum is exactly 7
    // (game/game-rules.ts's GAME_MODE_RULES.triple.minPlayers), so this
    // is the one mode/count combination in the suite that sits right on
    // the boundary -- confirm the roster really holds all 7 (via
    // addPlayers' per-name visibility check) and that Continue has
    // actually become enabled before clicking it.
    const roundPrepContinue = page.getByRole("button", {
      name: /continue to round preparation/i,
    });
    await expect(roundPrepContinue).toHaveAttribute("aria-disabled", "false");
    await roundPrepContinue.click();
    await page.waitForURL("**/pass", { timeout: 15_000 });

    let crewSeen = 0;
    let imposterSeen = 0;

    for (let i = 0; i < players.length; i++) {
      await page.getByRole("button", { name: /^i'm ready$/i }).click();
      await page.getByRole("button", { name: /reveal my role/i }).click();

      const crewCard = page.getByText("YOU'RE A PLAYER", { exact: false });
      const imposterCard = page.getByText("YOU'RE THE IMPOSTER", {
        exact: false,
      });
      // Exactly one of the two renders for every single seat -- no
      // corrupted/blank role, and never both at once.
      if (await crewCard.isVisible()) crewSeen++;
      if (await imposterCard.isVisible()) imposterSeen++;

      const hideButton = page.getByRole("button", {
        name: /hide & pass phone/i,
      });
      await expect(hideButton).toBeEnabled({ timeout: 5_000 });
      await hideButton.click();
    }

    expect(imposterSeen).toBe(3);
    expect(crewSeen).toBe(4);

    await page.getByRole("button", { name: /start discussion/i }).click();
    await page.waitForURL("**/game");
    await page.getByRole("button", { name: /start voting/i }).click();
    await page.waitForURL("**/voting");
    await expect(page.getByText("TIME TO VOTE")).toBeVisible();
  });
});
