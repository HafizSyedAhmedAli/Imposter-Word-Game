// e2e/fixtures.ts
import { expect, type Page } from "@playwright/test";

/**
 * Intercepts the same route the AI provider calls client-side
 * (providers/ai-word-provider.ts -> POST /api/round/generate) and
 * returns a fixed, valid word/hint pair. This is what keeps the whole
 * E2E suite deterministic and independent of the real Gemini API key /
 * network access (Step 8 + Step 7 of the task brief) -- every round in
 * these tests resolves via tier 1 with known, fixed content.
 */
export async function mockAiRoundGeneration(page: Page) {
  await page.route("**/api/round/generate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        word: "Pizza",
        hint: "A round dish often shared in slices.",
      }),
    });
  });
}

/**
 * Simulates the AI request failing outright, so a test can exercise the
 * offline fallback chain (tier 2 IndexedDB cache / tier 3 static list)
 * without actually toggling the browser's network state.
 */
export async function mockAiRoundGenerationFailure(page: Page) {
  await page.route("**/api/round/generate", async (route) => {
    await route.abort("failed");
  });
}

export type SeatedPlayer = { name: string };

export const DEFAULT_TEST_PLAYERS: SeatedPlayer[] = [
  { name: "Ahmed" },
  { name: "Asmed" },
  { name: "Mali" },
];

/**
 * Adds each player via the real Players screen UI, waiting for the
 * roster to actually show the name (not just for the click to resolve)
 * before moving on to the next one. This is the "prerequisite action"
 * the Continue button needs: PlayersContinueButton is enabled purely
 * off `players.length` (see game/game-rules.ts's isPlayerCountValid via
 * PlayersScreen.tsx), so if any single add is still in flight when the
 * loop moves on, the roster can silently end up one short of whatever
 * the selected mode requires -- which is exactly what a disabled
 * Continue button with the right-looking player count actually means.
 */
export async function addPlayers(page: Page, players: SeatedPlayer[]) {
  for (const player of players) {
    await page.getByLabel("Player name").fill(player.name);
    await page.getByRole("button", { name: /add player/i }).click();
    await expect(page.getByText(player.name, { exact: true })).toBeVisible();
  }
}

/**
 * Drives Home -> Setup -> Players using the default config (Classic
 * mode is already valid at 3 players -- see game/game-rules.ts), adding
 * the given players, then pressing Continue. Leaves the browser on
 * whatever screen Round Preparation lands on next (/pass once ready).
 */
export async function startGameWithPlayers(
  page: Page,
  players: SeatedPlayer[] = DEFAULT_TEST_PLAYERS,
) {
  await mockAiRoundGeneration(page);

  await page.goto("/");
  const playLink = page.getByRole("link", { name: /play game/i });
  await playLink.waitFor({ state: "visible" });
  await playLink.click();
  await page.waitForURL("**/setup");

  const setupContinue = page.getByRole("button", { name: /continue/i });
  await setupContinue.waitFor({ state: "visible" });
  await setupContinue.click();
  await page.waitForURL("**/players");

  await addPlayers(page, players);

  const roundPrepContinue = page.getByRole("button", {
    name: /continue to round preparation/i,
  });
  await expect(roundPrepContinue).toHaveAttribute("aria-disabled", "false");
  await roundPrepContinue.click();
  await page.waitForURL("**/pass", { timeout: 15_000 });
}

/**
 * Continues from startGameWithPlayers() through every player's secret
 * reveal, into Discussion, and presses "Start Voting" -- leaving the
 * browser on the Voting screen's first "pass the phone" prompt.
 */
export async function passAllPlayersAndReachDiscussion(
  page: Page,
  playerCount: number,
) {
  for (let i = 0; i < playerCount; i++) {
    await page.getByRole("button", { name: /^i'm ready$/i }).click();
    await page.getByRole("button", { name: /reveal my role/i }).click();
    const hideButton = page.getByRole("button", { name: /hide & pass phone/i });
    await hideButton.waitFor({ state: "visible" });
    await expect(hideButton).toBeEnabled({ timeout: 5_000 });
    await hideButton.click();
  }
  await page.getByRole("button", { name: /start discussion/i }).click();
  await page.waitForURL("**/game");
}

export async function startVoting(page: Page) {
  await page.getByRole("button", { name: /start voting/i }).click();
  await page.waitForURL("**/voting");
}

/** Casts one full vote (pass -> select -> confirm) for the current voter. */
export async function castVoteFor(page: Page, targetName: string) {
  await page.getByRole("button", { name: /^i'm ready$/i }).click();
  await page.getByRole("radio", { name: new RegExp(targetName, "i") }).click();
  await page.getByRole("button", { name: /^cast vote$/i }).click();
  await page.getByRole("button", { name: /confirm vote/i }).click();
}
