// instrumentation-client.ts
//
// Client-side Sentry initialization -- runs once, early, in the browser
// (both the normal Vercel web deploy and the Capacitor/Android WebView
// build, since this file only ever executes client-side JS either way).
//
// Entirely opt-in: if NEXT_PUBLIC_SENTRY_DSN isn't set, Sentry.init()
// is never called, so the SDK stays fully inert -- no network requests,
// no console output, no effect on the game whatsoever. This mirrors the
// same "unset key -> silently disabled" convention already used for
// PostHog (see lib/posthog-provider.tsx).
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,

    // Distinguishes the Vercel web deploy from the Capacitor/Android
    // build in the Sentry dashboard, since both share the same DSN.
    // Falls back to "web" for local dev / anything that isn't an
    // explicit capacitor build (see next.config.ts).
    initialScope: {
      tags: {
        platform:
          process.env.NEXT_PUBLIC_BUILD_TARGET === "capacitor"
            ? "capacitor"
            : "web",
      },
    },

    // Ties every event to the exact app version that produced it (the
    // same package.json version already exposed to the client for the
    // Settings screen's About card -- see next.config.ts). Set again
    // here (not just via the build-time `release` option below) so
    // events are correctly tagged even if source-map upload/release
    // creation is skipped (e.g. no SENTRY_AUTH_TOKEN configured yet).
    release: process.env.NEXT_PUBLIC_APP_VERSION,

    environment: process.env.NODE_ENV === "production"
      ? "production"
      : "development",

    // STEP 13: error monitoring + release tracking + source maps are
    // the priority for this first integration -- performance tracing
    // is deliberately off (0) rather than defaulted to some nonzero
    // sample rate, to avoid adding any tracing overhead to gameplay
    // until there's an actual need for it. Flip this via an env var
    // later if latency investigation becomes useful.
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0),

    // This is a party game with no accounts/login -- there is no
    // concept of a signed-in user to attach, and IP/user data collection
    // is intentionally left off rather than opted into.
    sendDefaultPii: false,

    // Defense-in-depth alongside lib/monitoring.ts's own scrubbing:
    // strips any breadcrumb/extra data that happens to carry one of the
    // game's sensitive field names, in case a future call site ever
    // passes one by mistake. The round's word/hint and player names must
    // never leave the device via Sentry -- see lib/monitoring.ts's doc
    // comment for the canonical list this mirrors.
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.data) {
        for (const key of Object.keys(breadcrumb.data)) {
          if (/word|hint|player|name|vote/i.test(key)) {
            delete breadcrumb.data[key];
          }
        }
      }
      return breadcrumb;
    },
  });
}

// Required by Next.js when using the client instrumentation hook, to
// capture navigation-related errors during router transitions.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;