// instrumentation.ts
//
// Next.js's instrumentation hook (stable since Next 14.0.4, no
// next.config.ts flag needed). `register()` runs once per server
// runtime at startup and is the standard place Sentry's Next.js SDK
// loads its runtime-specific init file.
//
// Only a `nodejs` branch exists here -- see sentry.server.config.ts's
// doc comment for why this app has no Edge runtime to instrument.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}

// Automatically captures any server-side request error that escapes a
// route handler/Server Component unhandled -- e.g. a genuine bug, not
// the expected, already-handled AI-fallback responses that
// app/api/round/generate/route.ts returns as normal 502/503 JSON (those
// are caught and returned by that route itself, so they never reach
// here; see that file's STEP 7 doc comment in the integration report).
export const onRequestError = Sentry.captureRequestError;
