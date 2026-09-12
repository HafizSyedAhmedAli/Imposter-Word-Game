// e2e/voting-history.spec.ts
import { test, expect } from "@playwright/test";
import {
  startGameWithPlayers,
  passAllPlayersAndIdentifyImposter,
  startVoting,
  castVoteFor,
  PLAYER_NAMES,
} from "./fixtures";

/**
 * Both specs below identify the real imposter (via
 * passAllPlayersAndIdentifyImposter) instead of relying on
 * voting-and-results.spec.ts's "everyone votes for the same player"
 * 3-player trick.
 * That's necessary here because a *specific*, known-safe crew target
 * is required for the first, non-eliminating round of the multi-round
 * test -- there's no way to guarantee that with an arbitrary name.
 */

test.describe("Voting History", () => {
  test("a game that ends in one round records exactly one round, with the correct tally and eliminated player", async ({
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

    for (const voter of playerNames) {
      const target = voter === imposterName ? crewNames[0] : imposterName;
      await castVoteFor(page, target);
    }

    await expect(page.getByText("ALL VOTES CAST")).toBeVisible();
    await page.getByRole("button", { name: /reveal results/i }).click();
    await page.waitForURL("**/results");

    await expect(
      page.getByRole("heading", { name: "THE RESULTS ARE IN!" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /see final results/i }).click();
    await page.waitForURL("**/final-results");

    await page.getByRole("button", { name: /voting history/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "VOTING HISTORY" }),
    ).toBeVisible();

    await expect(dialog.getByText("Round 1", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Round 2", { exact: true })).toHaveCount(0);

    const round1 = dialog.locator("section").filter({ hasText: "Round 1" });
    await expect(round1.getByText(imposterName, { exact: true })).toBeVisible();
    await expect(round1.getByText("2 votes", { exact: true })).toBeVisible();
    await expect(
      round1.getByText(`Eliminated: ${imposterName}`, { exact: false }),
    ).toBeVisible();

    await dialog
      .getByRole("button", { name: /back to final results/i })
      .click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("button", { name: /play again/i }),
    ).toBeVisible();
  });

  test("a game that continues past a tie records every round, in order, on the same game", async ({
    page,
  }) => {
    test.slow();

    const playerNames = PLAYER_NAMES.slice(0, 4);
    await startGameWithPlayers(
      page,
      playerNames.map((name) => ({ name })),
    );

    const { imposterName, crewNames } = await passAllPlayersAndIdentifyImposter(
      page,
      playerNames,
    );
    const [crewA, crewB, crewC] = crewNames;

    await startVoting(page);

    // Round 1: a deterministic 2-2 tie between two crew members, built
    // from *roles* rather than seat position so it holds regardless of
    // which player actually got the imposter card. crewA -> crewB,
    // crewB -> crewA, crewC -> crewA, imposter -> crewB. Tally: crewA
    // gets 2 (crewB's + crewC's votes), crewB gets 2 (crewA's + the
    // imposter's votes). A clean 2-2 tie that eliminates no one.
    const round1Targets: Record<string, string> = {
      [crewA]: crewB,
      [crewB]: crewA,
      [crewC]: crewA,
      [imposterName]: crewB,
    };
    for (const voter of playerNames) {
      await castVoteFor(page, round1Targets[voter]);
    }

    await expect(page.getByText("ALL VOTES CAST")).toBeVisible();
    await page.getByRole("button", { name: /reveal results/i }).click();
    await page.waitForURL("**/results");

    await expect(page.getByText("IT'S A TIE!")).toBeVisible();
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.waitForURL("**/game");

    await startVoting(page);

    // Round 2: everyone but the imposter votes for the imposter (3
    // votes); the imposter votes for crewA instead of themselves --
    // a deterministic 3-1 majority that catches the imposter and ends
    // the game.
    for (const voter of playerNames) {
      const target = voter === imposterName ? crewA : imposterName;
      await castVoteFor(page, target);
    }

    await expect(page.getByText("ALL VOTES CAST")).toBeVisible();
    await page.getByRole("button", { name: /reveal results/i }).click();
    await page.waitForURL("**/results");

    await expect(
      page.getByRole("heading", { name: "THE RESULTS ARE IN!" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /see final results/i }).click();
    await page.waitForURL("**/final-results");

    await page.getByRole("button", { name: /voting history/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "VOTING HISTORY" }),
    ).toBeVisible();

    const round1Heading = dialog.getByText("Round 1", { exact: true });
    const round2Heading = dialog.getByText("Round 2", { exact: true });
    await expect(round1Heading).toBeVisible();
    await expect(round2Heading).toBeVisible();
    const round1Box = await round1Heading.boundingBox();
    const round2Box = await round2Heading.boundingBox();
    expect(round1Box).not.toBeNull();
    expect(round2Box).not.toBeNull();
    expect(round1Box!.y).toBeLessThan(round2Box!.y);

    const round1 = dialog.locator("section").filter({ hasText: "Round 1" });
    await expect(round1.getByText("Tie", { exact: false })).toBeVisible();
    await expect(
      round1.getByText("no one eliminated", { exact: false }),
    ).toBeVisible();
    await expect(round1.getByText("2 votes", { exact: true })).toHaveCount(2);

    const round2 = dialog.locator("section").filter({ hasText: "Round 2" });
    await expect(
      round2.getByText(`Eliminated: ${imposterName}`, { exact: false }),
    ).toBeVisible();
    await expect(round2.getByText("3 votes", { exact: true })).toBeVisible();
  });
});
