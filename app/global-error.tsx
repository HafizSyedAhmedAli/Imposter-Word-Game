"use client";

// app/global-error.tsx
//
// The project had no error boundary before this integration (see
// STEP 10 of the integration spec) -- this file is the minimal one
// Sentry's Next.js App Router setup needs to catch an error thrown by
// the root layout itself, which no per-route `error.tsx` can ever catch
// (there is no per-route `error.tsx` in this app either; only this
// top-level, last-resort boundary is being added).
//
// This replaces the ENTIRE document (including <html>/<body>) when it
// renders, since it sits above the root layout -- so it deliberately
// stays self-contained and doesn't import any game component that could
// itself be part of what broke. It does still reuse the app's existing
// color tokens (globals.css) purely for visual consistency; if that
// import itself ever failed, the browser's own unstyled fallback
// rendering is still a safe degrade.
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col items-center justify-center gap-4 bg-iw-void px-6 text-center text-iw-ink-100">
        <p className="text-lg font-semibold">Something went wrong.</p>
        <p className="max-w-sm text-sm text-iw-ink-500">
          Sorry about that -- please try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full border border-iw-border-strong px-5 py-2 text-sm font-medium text-iw-ink-100"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
