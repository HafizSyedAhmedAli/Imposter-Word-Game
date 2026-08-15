/**
 * Every screen in the game, i.e. every route the app can navigate to
 * internally. This is the source of truth for the *client* code that
 * needs to reason about "is this one of our own screens" -- currently
 * lib/offline-navigation.ts (and, through it, lib/use-app-router.ts and
 * components/pwa/AppLink.tsx).
 *
 * The service worker (public/sw-template.js) has its own APP_ROUTES
 * constant with the same values. It can't import this file: it's a
 * plain, zero-dependency script by design (see the comment at the top
 * of sw-template.js) so it never risks colliding with Next.js's
 * bundler, and it isn't compiled by Next.js at all. scripts/generate-sw.js
 * cross-checks the two lists at build time (it fails the build if they
 * drift) -- see the ROUTE SYNC CHECK section there. If you add or
 * rename a screen, update both files.
 */
export const APP_ROUTES = [
  "/",
  "/setup",
  "/players",
  "/round",
  "/pass",
  "/game",
  "/voting",
  "/results",
  "/final-results",
  "/how-to-play",
  "/settings",
  "/statistics",
] as const;

export type AppRoute = (typeof APP_ROUTES)[number];
