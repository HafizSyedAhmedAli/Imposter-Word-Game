import { APP_ROUTES } from "@/lib/app-routes";

/**
 * Whether `path` is one of this app's own screens (as opposed to an
 * external URL, an API route, or a not-yet-built one). Query strings /
 * hashes are stripped before matching, though nothing in this app
 * currently uses them for internal links.
 */
export function isKnownAppRoute(path: string): boolean {
  const pathname = path.split("?")[0]?.split("#")[0] ?? path;
  return (APP_ROUTES as readonly string[]).includes(pathname);
}

function isOffline(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "onLine" in navigator &&
    navigator.onLine === false
  );
}

/**
 * The core offline-navigation fix.
 *
 * Next.js App Router's client-side navigation (router.push, <Link>,
 * etc.) fetches an RSC data payload for the target route in the
 * background rather than doing a real document navigation. If that
 * fetch fails -- which it always will offline -- App Router does NOT
 * reliably fall back to a full document navigation on its own; the
 * result can be a stuck transition or a browser-level connection error,
 * which is the root of the "Site can't be reached" bug this fixes. See
 * public/sw-template.js for the corresponding service-worker side of
 * this: it precaches every screen's full HTML document (APP_ROUTES) so
 * that a *real* document request for a known route can be served from
 * cache while offline.
 *
 * So: while offline, navigating to a known app route is done with
 * `window.location` instead of the router, forcing a real document
 * request that the service worker can intercept and answer from that
 * precache. Online, this never engages -- normal client-side navigation
 * is left completely alone.
 *
 * Returns true if it performed the navigation itself (the caller should
 * not also navigate); false if the caller should fall back to its
 * normal (online) navigation path.
 */
export function navigateInternal(target: string, replace = false): boolean {
  if (!isOffline() || !isKnownAppRoute(target)) return false;

  if (replace) {
    window.location.replace(target);
  } else {
    window.location.assign(target);
  }
  return true;
}
