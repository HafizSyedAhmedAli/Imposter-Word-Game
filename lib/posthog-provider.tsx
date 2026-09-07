"use client";

import { useEffect, useRef } from "react";
import posthog from "posthog-js";

/**
 * Mounted once in the root layout (same convention as
 * ServiceWorkerRegister/SoundProvider/PwaInstallAnalytics) to initialize
 * the PostHog client. `lib/analytics.ts` calls `posthog.capture()`
 * directly against the same singleton -- this component's only job is
 * to call `.init()` exactly once, with a config that keeps PostHog to
 * ONLY the 10 explicit events this app defines:
 *
 *  - autocapture, session recording, and heatmaps are all off -- this
 *    app never wants clicks/inputs/DOM snapshots captured automatically,
 *    only the specific named events in lib/analytics.ts (see that
 *    file's privacy doc comment).
 *  - pageview/pageleave capture is off too, so PostHog's dashboard shows
 *    exactly the 10 events and nothing else -- flip `capture_pageview`
 *    to `true` here if page-view charts are wanted later.
 *
 * Renders nothing -- see spec: "Do not create a visible component."
 */
export default function PostHogProvider() {
  const initedRef = useRef(false);

  useEffect(() => {
    // Guards against React StrictMode's double-invoked effects in dev,
    // and against a second mount re-running init() (posthog-js's own
    // init() already no-ops on a second call, but this keeps the intent
    // explicit and matches the codebase's established
    // once-per-mount-effect guard pattern, e.g.
    // RoundPreparationScreen's `startedRef`).
    if (initedRef.current) return;
    initedRef.current = true;

    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!apiKey) {
      // No key configured (e.g. local dev without .env.local) --
      // analytics.ts's safeTrack already checks `posthog.__loaded`
      // before calling capture(), so simply not initializing here is
      // enough to keep the app working with analytics silently
      // disabled. Never throws, never blocks rendering.
      return;
    }

    posthog.init(apiKey, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      person_profiles: "identified_only",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      capture_exceptions: false,
    });
  }, []);

  return null;
}
