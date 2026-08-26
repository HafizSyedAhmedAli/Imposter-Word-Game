// e2e/haptics.spec.ts
import { test, expect } from "@playwright/test";
import {
  passAllPlayersAndReachDiscussion,
  startGameWithPlayers,
} from "./fixtures";

/**
 * Installs a spy over navigator.vibrate before any app code runs, so
 * @capacitor/haptics' web fallback (which calls navigator.vibrate under
 * the hood outside a native shell -- see lib/haptics.ts's doc comment)
 * has something to call, and this test can observe whether it did.
 * Real desktop/mobile Chromium already implements the Vibration API, so
 * this stub only needs to *record* calls, not fake support for it.
 */
async function spyOnVibrate(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    (window as unknown as { __vibrateCalls: unknown[] }).__vibrateCalls = [];
    const original = navigator.vibrate?.bind(navigator);
    navigator.vibrate = ((pattern: number | number[]) => {
      (window as unknown as { __vibrateCalls: unknown[] }).__vibrateCalls.push(
        pattern,
      );
      return original ? original(pattern) : true;
    }) as typeof navigator.vibrate;
  });
}

async function vibrateCallCount(page: import("@playwright/test").Page) {
  return page.evaluate(
    () =>
      (window as unknown as { __vibrateCalls?: unknown[] }).__vibrateCalls
        ?.length ?? 0,
  );
}

test.describe("Haptic feedback", () => {
  test("stays off during gameplay when the Haptics setting is disabled", async ({
    page,
  }) => {
    await spyOnVibrate(page);

    await page.goto("/settings");
    const hapticsToggle = page.getByRole("switch", { name: /haptics/i });
    await expect(hapticsToggle).toHaveAttribute("aria-checked", "true");
    await hapticsToggle.click();
    await expect(hapticsToggle).toHaveAttribute("aria-checked", "false");

    await startGameWithPlayers(page);
    await passAllPlayersAndReachDiscussion(page, 3);

    expect(await vibrateCallCount(page)).toBe(0);
  });

  test("fires during gameplay when the Haptics setting is enabled (default)", async ({
    page,
  }) => {
    await spyOnVibrate(page);

    await startGameWithPlayers(page);
    // Ready -> Reveal -> Hide & Pass for just the first player is enough
    // to exercise the Player Reveal and Pass Phone Action haptics
    // without running the whole round.
    await page.getByRole("button", { name: /^i'm ready$/i }).click();
    await page.getByRole("button", { name: /reveal my role/i }).click();
    await page.getByRole("button", { name: /hide & pass phone/i }).click();

    expect(await vibrateCallCount(page)).toBeGreaterThan(0);
  });

  test("game remains fully playable when the haptic call itself fails", async ({
    page,
  }) => {
    // Force every vibrate call to throw, simulating a native/web haptic
    // failure -- lib/haptics.ts must swallow this (try/catch) so
    // gameplay is never interrupted by it.
    await page.addInitScript(() => {
      navigator.vibrate = (() => {
        throw new Error("simulated haptics failure");
      }) as typeof navigator.vibrate;
    });

    await startGameWithPlayers(page);
    await passAllPlayersAndReachDiscussion(page, 3);

    // Reaching Discussion at all proves reveal/pass/start-discussion
    // all completed normally despite every haptic call throwing.
    await expect(page).toHaveURL(/\/game$/);
  });
});
