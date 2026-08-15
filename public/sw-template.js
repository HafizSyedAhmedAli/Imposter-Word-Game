/**
 * Imposter Word -- Service Worker
 * ---------------------------------------------------------------------
 * Responsibility: get the APPLICATION (HTML/JS/CSS/fonts/icons) to load
 * offline. It knows nothing about game data -- that all lives in
 * IndexedDB via Dexie (see lib/db.ts) and is never touched here.
 *
 * This file is generated from sw-template.js by scripts/generate-sw.js,
 * which fills in CACHE_VERSION so every deploy gets a fresh cache
 * namespace and old caches are cleaned up on activate. Do not edit the
 * generated public/sw.js directly -- edit this template instead.
 */

const CACHE_VERSION = "__CACHE_VERSION__";
const CACHE_PREFIX = "imposter-word";
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`;
const CURRENT_CACHES = new Set([STATIC_CACHE, RUNTIME_CACHE]);

// Every screen in the game, precached as a full HTML document at
// install time. This is what lets the whole Home -> Play Game -> ... ->
// Results flow work offline right after the very first install, rather
// than only working for whichever screens happen to have been visited
// online first. (App Router client-side navigation between these
// fetches an RSC data payload, not this cached HTML directly -- but if
// that fetch fails, Next.js falls back to a real document navigation,
// which these precached entries do serve. See the fetch handler below.)
const APP_ROUTES = [
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
];

const PRECACHE_URLS = [
  ...APP_ROUTES,
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {
        // Precaching is best-effort -- a single missing/blocked asset
        // (e.g. during local dev) should never fail install.
      }),
  );
  // Intentionally NOT calling self.skipWaiting() here. An update should
  // sit in "waiting" until the user is done with their current game and
  // explicitly asks to refresh (see components/pwa/ServiceWorkerRegister.tsx),
  // or until every tab is closed and reopened. This avoids yanking the
  // app out from under an active round.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.has(key),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Lets the client ask a waiting worker to activate immediately (used by
// the "Update available" affordance -- see ServiceWorkerRegister.tsx).
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isNextStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    url.pathname.startsWith("/_next/static/")
  );
}

function isKnownStaticFile(url) {
  if (url.origin !== self.location.origin) return false;
  return (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/apple-touch-icon.png" ||
    url.pathname === "/favicon.ico" ||
    /\.(?:png|jpg|jpeg|svg|webp|gif|woff2?|ttf|otf|mp3|wav|ogg)$/i.test(
      url.pathname,
    )
  );
}

// Next.js App Router client-side navigation (router.push, <Link>, etc.)
// doesn't do a real document navigation -- it fetches an RSC data
// payload for the target route in the background, tagged with headers
// like these. We let that fetch go straight to the network untouched:
// its response body can be an in-progress stream, and cloning a stream
// for cache.put() is exactly the kind of thing that can throw and get
// misread as a network failure. The precached HTML documents in
// APP_ROUTES are what actually make each screen work offline; if this
// RSC fetch fails while offline, Next.js falls back to a full document
// navigation to the same URL, which the "navigate" branch below serves
// from that precache.
function isNextDataRequest(request) {
  return (
    request.headers.has("RSC") ||
    request.headers.has("Next-Router-State-Tree") ||
    request.headers.has("Next-Router-Prefetch")
  );
}

// Best-effort cache write: never let a caching side-effect turn a
// perfectly good network response into a failure.
async function safePut(cacheName, request, response) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
  } catch {
    // Ignore -- e.g. a streamed body that can't be cloned/cached.
  }
}

// Cache-first: for content-hashed, immutable build assets and local
// media/fonts. Safe to serve straight from cache; a fresh copy is only
// ever fetched once per cache version.
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    safePut(STATIC_CACHE, request, response.clone());
  }
  return response;
}

// Network-first: for navigations and other same-origin GETs, so players
// online always get the freshest content, while still working offline
// for anything precached (see APP_ROUTES) or previously visited.
async function networkFirst(request) {
  const skipCache = isNextDataRequest(request);

  try {
    const response = await fetch(request);
    if (!skipCache && response && response.ok) {
      safePut(RUNTIME_CACHE, request, response.clone());
    }
    return response;
  } catch (err) {
    if (!skipCache) {
      const cached = await caches.match(request);
      if (cached) return cached;
    }

    if (request.mode === "navigate") {
      // The target route's own document may be precached even if this
      // exact request (e.g. with RSC headers) wasn't.
      const url = new URL(request.url);
      const routeMatch = await caches.match(url.pathname);
      if (routeMatch) return routeMatch;

      const offline = await caches.match("/offline.html");
      if (offline) return offline;
    }

    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin (fonts CDN, analytics, etc. -- currently none, but stay
  // safe if one is ever added): let the browser handle it untouched.
  if (url.origin !== self.location.origin) return;

  // Never touch the AI round-generation endpoint (or any other API
  // route). It must fail fast and naturally offline so the app's own
  // fallback-word-provider logic can take over -- see
  // providers/ai-word-provider.ts / game/game-engine.ts.
  if (url.pathname.startsWith("/api/")) return;

  if (isNextStaticAsset(url) || isKnownStaticFile(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else same-origin: page navigations, RSC/data fetches for
  // client-side route transitions, the manifest, etc.
  event.respondWith(networkFirst(request));
});
