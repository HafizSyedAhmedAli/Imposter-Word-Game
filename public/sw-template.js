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

// Small, known-good set of URLs we can safely precache at install time.
// We deliberately do NOT try to precache hashed /_next/static/ build
// output here (that list isn't known without a bundler plugin) -- those
// are instead cached at runtime, cache-first, as the user visits pages
// while online. See requirement: "open the app online, browse the main
// screens" before first offline use.
const PRECACHE_URLS = [
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

// Cache-first: for content-hashed, immutable build assets and local
// media/fonts. Safe to serve straight from cache; a fresh copy is only
// ever fetched once per cache version.
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

// Network-first: for navigations and same-origin data/RSC fetches, so
// players online always get the freshest content, while still working
// offline once a route has been visited at least once.
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
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

  // Everything else same-origin (page navigations, RSC/data fetches for
  // client-side route transitions, manifest, etc.)
  event.respondWith(networkFirst(request));
});
