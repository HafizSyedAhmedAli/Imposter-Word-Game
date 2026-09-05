// e2e/language.spec.ts
import { test, expect } from "@playwright/test";
import {
  mockAiRoundGeneration,
  addPlayers,
  DEFAULT_TEST_PLAYERS,
} from "./fixtures";

// Matches any Urdu/Arabic or Devanagari script character -- the same
// ranges game/round-validation.ts's containsNonLatinScript guards
// against. Used here as an end-to-end sanity check that no non-Latin
// script ever reaches the screen while Roman Urdu is selected.
const NON_LATIN_SCRIPT =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0900-\u097F]/;

// The Settings screen's language radio buttons render both the label
// ("English") and a longer description in the same <button>, so each
// radio's accessible name is their concatenation -- e.g. "English Words
// and hints in English", or "Roman Urdu Hints in Roman Urdu, written
// with English letters". Notably, the Roman Urdu description itself
// contains the word "English" (as in "English letters"), so an
// unanchored /english/i would match BOTH buttons and trip a Playwright
// strict-mode violation. Anchoring to the start of the name (where only
// the label itself lives) disambiguates the two reliably.
function languageRadio(
  page: import("@playwright/test").Page,
  label: "English" | "Roman Urdu",
) {
  return page.getByRole("radio", {
    name: new RegExp(`^${label}\\b`, "i"),
  });
}

async function selectLanguage(
  page: import("@playwright/test").Page,
  label: "English" | "Roman Urdu",
) {
  const option = languageRadio(page, label);
  await option.waitFor({ state: "visible" });
  await option.click();
  await expect(option).toHaveAttribute("aria-checked", "true");
}

test.describe("Language setting (Roman Urdu)", () => {
  test("selecting Roman Urdu persists across a reload", async ({ page }) => {
    await page.goto("/settings");

    const english = languageRadio(page, "English");
    await expect(english).toHaveAttribute("aria-checked", "true");

    await selectLanguage(page, "Roman Urdu");

    await page.reload();
    await expect(languageRadio(page, "Roman Urdu")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(english).toHaveAttribute("aria-checked", "false");
  });

  test("a Roman Urdu round shows Roman Urdu content end-to-end, never leaking English or non-Latin script", async ({
    page,
  }) => {
    await mockAiRoundGeneration(page);

    await page.goto("/settings");
    await selectLanguage(page, "Roman Urdu");

    await page.goto("/");
    const playLink = page.getByRole("link", { name: /play game/i });
    await playLink.waitFor({ state: "visible" });
    await playLink.click();
    await page.waitForURL("**/setup");

    await page.getByRole("button", { name: /continue/i }).click();
    await page.waitForURL("**/players");
    await addPlayers(page, DEFAULT_TEST_PLAYERS);

    const roundPrepContinue = page.getByRole("button", {
      name: /continue to round preparation/i,
    });
    await expect(roundPrepContinue).toHaveAttribute("aria-disabled", "false");
    await roundPrepContinue.click();
    await page.waitForURL("**/pass", { timeout: 15_000 });

    for (let i = 0; i < DEFAULT_TEST_PLAYERS.length; i++) {
      await page.getByRole("button", { name: /^i'm ready$/i }).click();
      await page.getByRole("button", { name: /reveal my role/i }).click();

      // Whichever role this player got, the on-screen text must never
      // contain Urdu/Arabic/Devanagari script -- our Roman Urdu fixture
      // content ("Iske slice bana kar khate hain.") is pure Latin
      // script, so this fails loudly if real Urdu script ever leaked
      // through instead.
      const bodyText = await page.locator("body").innerText();
      expect(bodyText).not.toMatch(NON_LATIN_SCRIPT);

      // The imposter is shown the (Roman Urdu) hint; crew players are
      // shown the word itself -- see components/pass/PassPhoneScreen.tsx.
      // Whichever card is showing, it must reflect the Roman Urdu
      // content our mock returned, never an English hint sentence.
      const imposterCard = page.getByText("Iske slice bana kar khate hain.", {
        exact: false,
      });
      const crewCard = page.getByText("Pizza", { exact: false });
      await expect(imposterCard.or(crewCard)).toBeVisible();
      await expect(
        page.getByText("A round dish often shared in slices.", {
          exact: false,
        }),
      ).not.toBeVisible();

      const hideButton = page.getByRole("button", {
        name: /hide & pass phone/i,
      });
      await expect(hideButton).toBeEnabled({ timeout: 5_000 });
      await hideButton.click();
    }
  });

  test("switching back to English is used for the next round's AI request", async ({
    page,
  }) => {
    let lastRequestedLanguage: string | undefined;
    await page.route("**/api/round/generate", async (route) => {
      const body = route.request().postDataJSON() as { language?: string };
      lastRequestedLanguage = body?.language;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          word: "Pizza",
          hint: "A round dish often shared in slices.",
        }),
      });
    });

    await page.goto("/settings");
    await selectLanguage(page, "Roman Urdu");
    await selectLanguage(page, "English");

    await page.goto("/");
    await page.getByRole("link", { name: /play game/i }).click();
    await page.waitForURL("**/setup");
    await page.getByRole("button", { name: /continue/i }).click();
    await page.waitForURL("**/players");
    await addPlayers(page, DEFAULT_TEST_PLAYERS);
    await page
      .getByRole("button", { name: /continue to round preparation/i })
      .click();
    await page.waitForURL("**/pass", { timeout: 15_000 });

    expect(lastRequestedLanguage).toBe("english");
  });
});
