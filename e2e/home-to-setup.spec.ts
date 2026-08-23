import { test, expect } from "@playwright/test";

test.describe("Home -> Setup", () => {
  test("home page loads with a Play Game entry point", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /play game/i })).toBeVisible();
  });

  test("clicking Play navigates to Setup", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /play game/i }).click();
    await page.waitForURL("**/setup");
    await expect(page).toHaveURL(/\/setup$/);
  });
});