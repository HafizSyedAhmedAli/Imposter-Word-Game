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
// online first.
//
// Keep this in sync with lib/app-routes.ts (the client-side copy of
// this same list -- see the comment there for why there are two) --
// scripts/generate-sw.js checks the two against each other at build
// time and fails the build if they drift.
//
// App Router client-side navigation between these routes fetches an
// RSC data payload, not this cached HTML directly, and does NOT
// reliably fall back to a real document navigation on its own if that
// fetch fails offline. So the app itself (lib/offline-navigation.ts)
// forces a real document navigation while offline, which is what
// actually reaches this precache -- see the fetch handler below for the
// service-worker side of that.
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
  "/sounds/ambient-menu.mp3",
  "/sounds/game-start.mp3",
  "/sounds/ui-tap.mp3",
  "/sounds/ui-confirm.mp3",
  "/sounds/ui-error.mp3",
  "/sounds/transition-pass.mp3",
  "/sounds/phase-discussion.mp3",
  "/sounds/reveal-player.mp3",
  "/sounds/timer-tick.mp3",
  "/sounds/timer-end.mp3",
  "/sounds/results-lose.mp3",
  "/sounds/result-imposter-wins.mp3",
  "/sounds/result-crew-wins.mp3",
];

// Precache every URL independently rather than with cache.addAll(),
// which is atomic: if even one entry 404s (or otherwise fails), the
// whole addAll() call rejects and *nothing* in the batch gets cached.
// Swallowing that rejection (the old `.catch(() => {})` below) made it
// fail silently -- install "succeeded" while precaching had actually
// cached nothing at all, which is exactly why offline support looked
// inconsistent: routes only worked offline if the player happened to
// have visited them online first (picked up by the runtime cache in
// networkFirst() below), and every route that was never visited failed
// with "Site can't be reached". Caching each URL on its own means one
// bad entry only costs that entry.
async function precacheAll(urls) {
  const cache = await caches.open(STATIC_CACHE);
  const results = await Promise.allSettled(urls.map((url) => cache.add(url)));
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      // Visible in the browser console / Application > Service Workers
      // panel for development and build verification. Never shown to
      // normal users, who don't have devtools open for this.
      console.warn(`[sw] failed to precache "${urls[i]}":`, result.reason);
    }
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAll(PRECACHE_URLS));
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
// misread as a network failure. This fetch is simply left to fail
// offline -- the app itself (lib/offline-navigation.ts) is what turns
// that into a real document navigation to the same URL when needed, and
// THAT request is what the "navigate" branch below serves from the
// APP_ROUTES precache.
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
    await safePut(STATIC_CACHE, request, response.clone());
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
      await safePut(RUNTIME_CACHE, request, response.clone());
    }
    return response;
  } catch (err) {
    // ...unchanged
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
