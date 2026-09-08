// sentry.server.config.ts
//
// Server-side Sentry initialization. Only ever imported by
// instrumentation.ts's register() when NEXT_RUNTIME === "nodejs" -- the
// only server runtime this app uses (app/api/round/generate/route.ts
// explicitly pins `export const runtime = "nodejs"`, and nothing else
// runs server-side). There is no sentry.edge.config.ts because this app
// has no Edge runtime code to instrument.
//
// This file has no effect at all on the Capacitor/Android build:
// scripts/build-mobile.mjs removes app/api and forces `output: "export"`
// for that build, so there is no Next.js server for this file to run in.
//
// Entirely opt-in, same as instrumentation-client.ts: with no DSN
// configured, Sentry.init() is skipped and the SDK stays fully inert.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,

    initialScope: {
      tags: { platform: "web-server" },
    },

    release: process.env.NEXT_PUBLIC_APP_VERSION,

    environment:
      process.env.NODE_ENV === "production" ? "production" : "development",

    // See instrumentation-client.ts's matching comment -- errors and
    // release tracking are the priority for this first integration, not
    // performance tracing.
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0,
    ),

    sendDefaultPii: false,

    // Defense-in-depth alongside lib/monitoring.ts's own scrubbing. The
    // AI provider key (GEMINI_API_KEY) is read only inside
    // app/api/round/generate/route.ts and is never put into an Error's
    // message/extra data by that route, but this is a second line of
    // defense against any secret accidentally ending up in an
    // exception's context.
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers["x-api-key"];
        delete event.request.headers["authorization"];
      }
      return event;
    },
  });
}