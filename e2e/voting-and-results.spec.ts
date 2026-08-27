// e2e/voting-and-results.spec.ts
import { test, expect } from "@playwright/test";
import {
  startGameWithPlayers,
  passAllPlayersAndReachDiscussion,
  startVoting,
  castVoteFor,
  DEFAULT_TEST_PLAYERS,
} from "./fixtures";

test.describe("Voting", () => {
  test("voting screen appears, a player can be selected, and a vote can be submitted", async ({
    page,
  }) => {
    await startGameWithPlayers(page);
    await passAllPlayersAndReachDiscussion(page, DEFAULT_TEST_PLAYERS.length);
    await startVoting(page);

    await expect(page.getByText("TIME TO VOTE")).toBeVisible();
    await page.getByRole("button", { name: /^i'm ready$/i }).click();

    await expect(page.getByText("WHO IS THE IMPOSTER?")).toBeVisible();
    await page.getByRole("radio", { name: /bob/i }).click();
    await expect(page.getByRole("radio", { name: /bob/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page.getByRole("button", { name: /^cast vote$/i }).click();
    await expect(page.getByText(/vote for bob\?/i)).toBeVisible();
    await page.getByRole("button", { name: /confirm vote/i }).click();

    // Either "VOTE RECORDED" (more voters remain) or straight to
    // "ALL VOTES CAST" if Alice happened to be the last voter -- both
    // are valid, deterministic outcomes of a successfully-cast vote.
    await expect(page.getByText(/vote recorded|all votes cast/i)).toBeVisible();
  });

  test("results/elimination screen appears once every player has voted", async ({
    page,
  }) => {
    // Full pass-the-phone (with its ~2s reveal-hold per player -- see
    // PlayerRevealCard/ImposterRevealCard) *plus* a full 3-vote cycle
    // *plus* the Results screen render is comfortably heavier than the
    // suite's default 30s budget on a production `next start` server,
    // especially under load -- see multi-imposter.spec.ts's identical
    // note. Not an app bug: the failure trace shows the Results screen
    // already fully, correctly rendered when the timeout hit.
    test.slow();

    await startGameWithPlayers(page);
    await passAllPlayersAndReachDiscussion(page, DEFAULT_TEST_PLAYERS.length);
    await startVoting(page);

    // Everyone but Bob votes for Bob; Bob votes for Cara. Bob ends up
    // with 2 votes (a deterministic majority) regardless of which
    // player was secretly assigned the imposter role.
    await castVoteFor(page, "Bob"); // Alice -> Bob
    await castVoteFor(page, "Cara"); // Bob -> Cara
    await castVoteFor(page, "Bob"); // Cara -> Bob

    await expect(page.getByText("ALL VOTES CAST")).toBeVisible();
    await page.getByRole("button", { name: /reveal results/i }).click();
    await page.waitForURL("**/results");

    await expect(
      page.getByRole("heading", { name: "THE RESULTS ARE IN!" }),
    ).toBeVisible();
    // Bob was the deterministic 2-vote majority target. Scoped to the
    // "Most Voted" card specifically (components/results/MostVotedCard.tsx)
    // rather than a bare page-wide text match: the results screen
    // legitimately shows "Bob" twice -- once in the vote-tally list
    // (VoteResultsCard) and again as the prominent most-voted callout --
    // so an unscoped getByText("Bob") is ambiguous by design, not a bug.
    const mostVotedCard = page
      .locator("section")
      .filter({ hasText: "Most Voted" });
    await expect(mostVotedCard.getByText("Bob", { exact: true })).toBeVisible();
  });
});
