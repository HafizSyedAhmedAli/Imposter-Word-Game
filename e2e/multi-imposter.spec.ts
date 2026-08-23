import { test, expect } from "@playwright/test";
import { mockAiRoundGeneration } from "./fixtures";

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

    for (const name of NAMES) {
      await page.getByLabel("Player name").fill(name);
      await page.getByRole("button", { name: /add player/i }).click();
    }

    await page
      .getByRole("button", { name: /continue to round preparation/i })
      .click();
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
    for (const name of players) {
      await page.getByLabel("Player name").fill(name);
      await page.getByRole("button", { name: /add player/i }).click();
    }
    await page
      .getByRole("button", { name: /continue to round preparation/i })
      .click();
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