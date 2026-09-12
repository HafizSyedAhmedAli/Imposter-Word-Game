import { describe, it, expect } from "vitest";
import { MENU_ROUTES } from "@/components/pwa/MenuMusicController";
import { APP_ROUTES } from "@/lib/app-routes";

/**
 * Routes that are deliberately NOT part of the ambient menu flow --
 * these are the in-round/results screens where MenuMusicController
 * fades the ambient bed OUT (see GAME_START_FADE_MS) rather than
 * playing it across them. Kept as an explicit list (rather than
 * "everything not in MENU_ROUTES") so a brand new route always has to
 * be consciously placed on one side or the other instead of silently
 * defaulting to "not a menu route" -- which is exactly how
 * /settings/custom-words shipped without ambient music: it was added to
 * APP_ROUTES but nobody also added it to MENU_ROUTES, so the bed cut
 * out the moment a player visited it.
 */
const NON_MENU_ROUTES = new Set<string>([
  "/pass",
  "/game",
  "/voting",
  "/results",
  "/final-results",
  "/statistics",
]);

describe("MenuMusicController's MENU_ROUTES", () => {
  it("only contains real app routes -- catches typos and stale/removed routes", () => {
    const appRouteSet: ReadonlySet<string> = new Set(APP_ROUTES);
    const unknown = [...MENU_ROUTES].filter((route) => !appRouteSet.has(route));
    expect(unknown).toEqual([]);
  });

  it("classifies every app route as either a menu route or an explicit non-menu route", () => {
    // The real regression this guards against: a new screen (most often
    // a Settings sub-screen, exactly like /settings/custom-words) gets
    // added to APP_ROUTES but never added to MENU_ROUTES (or
    // NON_MENU_ROUTES above), so the ambient bed silently stops the
    // moment a player visits it -- with nothing failing loudly to catch
    // it. Forces every new route to be placed on one side or the other.
    const unclassified = APP_ROUTES.filter(
      (route) => !MENU_ROUTES.has(route) && !NON_MENU_ROUTES.has(route),
    );
    expect(unclassified).toEqual([]);
  });

  it("never lists the same route as both a menu route and a non-menu route", () => {
    const overlap = [...MENU_ROUTES].filter((route) =>
      NON_MENU_ROUTES.has(route),
    );
    expect(overlap).toEqual([]);
  });

  it("keeps every Settings sub-screen in the menu flow", () => {
    // Settings sub-screens (Custom Words today, whatever comes next) are
    // always reached from within the menu flow and always lead back
    // into it, so the ambient bed should never cut out for one of them.
    const settingsSubRoutes = APP_ROUTES.filter((route) =>
      route.startsWith("/settings/"),
    );

    expect(settingsSubRoutes.length).toBeGreaterThan(0);
    for (const route of settingsSubRoutes) {
      expect(MENU_ROUTES.has(route)).toBe(true);
    }
  });
});