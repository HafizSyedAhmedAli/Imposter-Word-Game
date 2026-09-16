// e2e/achievements.spec.ts
import { test, expect } from "@playwright/test";
import {
  startGameWithPlayers,
  passAllPlayersAndIdentifyImposter,
  startVoting,
  castVoteFor,
  PLAYER_NAMES,
} from "./fixtures";

/**
 * End-to-end coverage for the Achievements feature (Home ->
 * ACHIEVEMENTS, and the Final Results screen's unlock toast/banner).
 * Nothing here existed before -- the feature previously had unit-level
 * coverage only (test/achievements/*.test.ts), with no test driving the
 * real UI: the unlock toast, the Final Results banner, the Achievements
 * screen itself, or its per-player selector.
 *
 * Every test here identifies the real imposter via
 * `passAllPlayersAndIdentifyImposter` (same convention as
 * e2e/voting-history.spec.ts) so the crew-vs-imposter achievement state
 * asserted below is deterministic rather than "whoever happened to get
 * the imposter card this run".
 */

test.describe("Achievements", () => {
  test("shows the empty state before any game has been completed, and links into Setup", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /achievements/i }).click();
    await page.waitForURL("**/achievements");

    await expect(page.getByText("No achievements yet")).toBeVisible();
    await expect(
      page.getByRole("tablist", { name: /select a player/i }),
    ).toHaveCount(0);

    await page.getByRole("link", { name: /play game/i }).click();
    await page.waitForURL("**/setup");
  });

  test("a crew win with the Imposter caught unlocks achievements via the toast, the Final Results banner, and the Achievements screen", async ({
    page,
  }) => {
    test.slow();

    const playerNames = PLAYER_NAMES.slice(0, 3);
    await startGameWithPlayers(
      page,
      playerNames.map((name) => ({ name })),
    );

    const { imposterName, crewNames } = await passAllPlayersAndIdentifyImposter(
      page,
      playerNames,
    );

    await startVoting(page);

    // Everyone votes the real Imposter out (the Imposter votes a crew
    // member instead of themselves) -- a deterministic 2-1 majority
    // that catches the Imposter and ends the game in one round, exactly
    // like e2e/voting-history.spec.ts's single-round test. With exactly
    // 3 players and 1 Imposter, this always yields: 2 crew members each
    // newly unlocking First Game + Imposter Hunter, and the Imposter
    // newly unlocking only First Game -- 5 unlocks total, regardless of
    // which seat the Imposter landed in.
    for (const voter of playerNames) {
      const target = voter === imposterName ? crewNames[0] : imposterName;
      await castVoteFor(page, target);
    }

    await expect(page.getByText("ALL VOTES CAST")).toBeVisible();
    await page.getByRole("button", { name: /reveal results/i }).click();
    await page.waitForURL("**/results");
    await page.getByRole("button", { name: /see final results/i }).click();
    await page.waitForURL("**/final-results");

    // --- Unlock toast ---
    // Achievements are evaluated in ACHIEVEMENTS definition order per
    // player (see lib/achievements/engine.ts), and First Game is the
    // very first definition -- so regardless of which player happens to
    // be first in the session, the very first queued toast event is
    // always a First Game unlock, and the queue always holds all 5.
    const toast = page.getByRole("status");
    await expect(toast).toBeVisible();
    await expect(toast.getByText(/unlocked an achievement/i)).toBeVisible();
    await expect(toast.getByText("First Game", { exact: true })).toBeVisible();
    await expect(toast.getByText("1 of 5", { exact: true })).toBeVisible();

    // --- Final Results banner ---
    const banner = page.getByRole("link", {
      name: /5 Achievements Unlocked/i,
    });
    await expect(banner).toBeVisible();

    await banner.click();
    await page.waitForURL("**/achievements");

    // --- Achievements screen: a crew member who helped catch the Imposter ---
    const crewTab = page.getByRole("tab", {
      name: new RegExp(crewNames[0], "i"),
    });
    await expect(crewTab).toBeVisible();
    await crewTab.click();

    const crewFirstGameCard = page
      .locator("li")
      .filter({ hasText: "First Game" });
    await expect(crewFirstGameCard.getByText("Unlocked")).toBeVisible();

    const imposterHunterCard = page
      .locator("li")
      .filter({ hasText: "Imposter Hunter" });
    await expect(imposterHunterCard.getByText("Unlocked")).toBeVisible();

    const partyStarterCard = page
      .locator("li")
      .filter({ hasText: "Party Starter" });
    await expect(partyStarterCard.getByText("1 / 10")).toBeVisible();

    // --- Achievements screen: the Imposter, who lost, gets far less credit ---
    const imposterTab = page.getByRole("tab", {
      name: new RegExp(imposterName, "i"),
    });
    await imposterTab.click();

    const imposterFirstGameCard = page
      .locator("li")
      .filter({ hasText: "First Game" });
    await expect(imposterFirstGameCard.getByText("Unlocked")).toBeVisible();

    const firstBetrayalCard = page
      .locator("li")
      .filter({ hasText: "First Betrayal" });
    await expect(firstBetrayalCard.getByText("Locked")).toBeVisible();

    // The Imposter never gets Crew-side credit for their own catch.
    const imposterHunterForImposter = page
      .locator("li")
      .filter({ hasText: "Imposter Hunter" });
    await expect(imposterHunterForImposter.getByText("Locked")).toBeVisible();
  });

  test("Reset Game Data clears achievement history back to the empty state", async ({
    page,
  }) => {
    test.slow();

    // Regression coverage for a real bug: lib/reset-game-data.ts once
    // shipped with an unresolved merge conflict that silently dropped
    // the `resetAchievements()` call, so achievement history survived a
    // reset. test/lib/reset-game-data.test.ts now catches that at the
    // unit level; this proves the same thing through the real Settings
    // UI end-to-end.
    const playerNames = PLAYER_NAMES.slice(0, 3);
    await startGameWithPlayers(
      page,
      playerNames.map((name) => ({ name })),
    );

    const { imposterName, crewNames } = await passAllPlayersAndIdentifyImposter(
      page,
      playerNames,
    );
    await startVoting(page);

    for (const voter of playerNames) {
      const target = voter === imposterName ? crewNames[0] : imposterName;
      await castVoteFor(page, target);
    }

    await expect(page.getByText("ALL VOTES CAST")).toBeVisible();
    await page.getByRole("button", { name: /reveal results/i }).click();
    await page.waitForURL("**/results");
    await page.getByRole("button", { name: /see final results/i }).click();
    await page.waitForURL("**/final-results");

    await expect(
      page.getByRole("link", { name: /achievements unlocked/i }),
    ).toBeVisible();

    await page.goto("/achievements");
    await expect(page.getByText("No achievements yet")).toHaveCount(0);
    await expect(
      page.getByRole("tablist", { name: /select a player/i }),
    ).toBeVisible();

    // --- Reset from Settings ---
    await page.goto("/settings");
    await page.getByRole("button", { name: /reset game data/i }).click();
    await expect(page.getByText(/permanently delete/i)).toBeVisible();
    await page.getByRole("button", { name: /^reset data$/i }).click();
    await expect(page.getByText(/game data reset successfully/i)).toBeVisible();

    // --- Achievements screen is back to the pre-game empty state ---
    await page.goto("/achievements");
    await expect(page.getByText("No achievements yet")).toBeVisible();
    await expect(
      page.getByRole("tablist", { name: /select a player/i }),
    ).toHaveCount(0);
  });
});
