import { test, expect } from "@playwright/test";
import { startGameWithPlayers } from "./fixtures";

test.describe("Resume game", () => {
  test("reloading mid-round does not lose the active game", async ({
    page,
  }) => {
    await startGameWithPlayers(page);

    // sessionStorage-backed recovery (lib/round-session-store.ts) --
    // a same-tab reload should land right back on the same in-round
    // screen, not bounce to Home.
    await page.reload();
    await expect(page).toHaveURL(/\/pass$/);
    await expect(page.getByText(/pass the phone to/i)).toBeVisible();
  });

  test("a fully new browser context (closed app) offers RESUME GAME on next launch", async ({
    page,
    context,
  }) => {
    await startGameWithPlayers(page);

    // localStorage-backed recovery (lib/active-game-recovery.ts) --
    // simulates the app being fully closed and relaunched by opening a
    // brand-new tab that shares the same storage state.
    const newPage = await context.newPage();
    await newPage.goto("/");

    await expect(newPage.getByText("Game in Progress")).toBeVisible();
    await newPage.getByRole("button", { name: /resume game/i }).click();
    await newPage.waitForURL("**/pass");
    await expect(newPage.getByText(/pass the phone to/i)).toBeVisible();
  });

  test("START NEW GAME on the recovery prompt discards the old game", async ({
    page,
    context,
  }) => {
    await startGameWithPlayers(page);

    const newPage = await context.newPage();
    await newPage.goto("/");
    await expect(newPage.getByText("Game in Progress")).toBeVisible();
    await newPage.getByRole("button", { name: /start new game/i }).click();

    await expect(newPage.getByText("Game in Progress")).not.toBeVisible();
    await expect(
      newPage.getByRole("link", { name: /play game/i }),
    ).toBeVisible();
  });
});