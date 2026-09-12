// e2e/custom-words.spec.ts
import { test, expect } from "@playwright/test";
import { mockAiRoundGeneration, addPlayers } from "./fixtures";

const CUSTOM_WORD = "Zephyrtron";

const PLAYER_NAMES = [
  "Ahmed",
  "Asmed",
  "Mali",
  "Hafsa",
  "Bareera",
  "Hamza",
  "Fatima",
  "Ayan",
  "Muniza",
  "Arham",
  "Emaan",
  "Sania",
];

// This spec needs 3 players -- the minimum Classic mode allows -- so it
// takes the first 3 names off the shared pool, same convention as every
// other spec's sequential slice of PLAYER_NAMES.
const testPlayerNames = PLAYER_NAMES.slice(0, 3);

test.describe("Custom Words", () => {
  test("a saved custom word appears in the list, is used as the round's secret word, and can be deleted", async ({
    page,
  }) => {
    test.slow();

    // --- Add a custom word from Settings -> Custom Words ---
    await page.goto("/settings/custom-words");
    await page.getByLabel("Word", { exact: true }).fill(CUSTOM_WORD);
    await page.getByRole("button", { name: /save word/i }).click();

    // Optimistic insert (CustomWordsScreen.handleAdd) -- no reload needed.
    await expect(page.getByText(CUSTOM_WORD, { exact: true })).toBeVisible();

    // --- Start a game with Custom Words selected as the category ---
    await mockAiRoundGeneration(page);

    await page.goto("/");
    const playLink = page.getByRole("link", { name: /play game/i });
    await playLink.waitFor({ state: "visible" });
    await playLink.click();
    await page.waitForURL("**/setup");

    // "Custom Words" lives in the "More" sheet (game/game-rules.ts's
    // MORE_CATEGORIES) rather than the top-level category row.
    await page.getByRole("radio", { name: "More" }).click();
    const moreSheet = page.getByRole("dialog", { name: /more categories/i });
    await moreSheet.getByRole("radio", { name: "Custom Words" }).click();
    await expect(moreSheet).toBeHidden();
    // Picking from the sheet is reflected back on "More" itself
    // (CategorySelector's isFromMoreSheet), confirming the selection stuck.
    await expect(page.getByRole("radio", { name: "More" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    const setupContinue = page.getByRole("button", { name: /continue/i });
    await setupContinue.waitFor({ state: "visible" });
    await setupContinue.click();
    await page.waitForURL("**/players");

    await addPlayers(
      page,
      testPlayerNames.map((name) => ({ name })),
    );

    const roundPrepContinue = page.getByRole("button", {
      name: /continue to round preparation/i,
    });
    await expect(roundPrepContinue).toHaveAttribute("aria-disabled", "false");
    await roundPrepContinue.click();
    await page.waitForURL("**/pass", { timeout: 15_000 });

    // --- Confirm the round actually uses the custom word ---
    // With exactly one saved custom word, getRandomCustomWord (lib/db.ts)
    // has exactly one candidate, so every crew member's card must show
    // this precise word -- nothing probabilistic to account for here.
    // The imposter never receives a `word` prop at all (see
    // ImposterRevealCard's comment), so only crew cards are checked.
    let sawCrewWord = false;
    for (let i = 0; i < testPlayerNames.length; i++) {
      await page.getByRole("button", { name: /^i'm ready$/i }).click();
      await page.getByRole("button", { name: /reveal my role/i }).click();

      const imposterCard = page.getByText("YOU'RE THE IMPOSTER", {
        exact: false,
      });
      const hideButton = page.getByRole("button", {
        name: /hide & pass phone/i,
      });
      await expect(hideButton).toBeEnabled({ timeout: 5_000 });

      if (!(await imposterCard.isVisible())) {
        await expect(
          page.getByText(CUSTOM_WORD, { exact: true }),
        ).toBeVisible();
        sawCrewWord = true;
      }

      await hideButton.click();
    }
    expect(sawCrewWord).toBe(true);

    // The remaining flow (discussion/voting/results) is already covered by
    // secret-reveal.spec.ts and voting-history.spec.ts -- this spec only
    // needs to prove the custom word reached the reveal screen, so it stops
    // here rather than duplicating that coverage.

    // --- Delete the word and confirm it's gone ---
    await page.goto("/settings/custom-words");
    await expect(page.getByText(CUSTOM_WORD, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Delete ${CUSTOM_WORD}` }).click();
    await expect(
      page.getByText("This only removes it from your saved list", {
        exact: false,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^delete$/i }).click();

    await expect(page.getByText(CUSTOM_WORD, { exact: true })).toHaveCount(0);
    await expect(page.getByText("No custom words yet")).toBeVisible();
  });
});
