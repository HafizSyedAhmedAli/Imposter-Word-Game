"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Intercepts an attempt to navigate back -- browser/PWA back
 * navigation *and*, inside the native Android app, the hardware Back
 * button -- and calls `onBackAttempt` instead of letting it through.
 *
 * Every in-round screen (Pass Phone, Discussion, Voting, Results,
 * Final Results) mounts this for exactly as long as leaving mid-round
 * should require the "Leave this round?" confirmation; screens outside
 * an active round (Home, Setup, Players, Settings, How to Play,
 * Statistics, Round Preparation) never mount it at all, so Back there
 * keeps its normal platform behavior untouched. That mount lifetime
 * *is* the active-round check -- there's no separate global
 * "is a round active" flag to keep in sync, and no risk of double
 * listeners, since only one of these screens is ever mounted at once.
 *
 * Browser/PWA: unchanged from the original per-screen implementation --
 * push a sentinel history entry and listen for `popstate`.
 *
 * Capacitor Android: physical-device testing showed the popstate trick
 * above does NOT intercept the hardware Back button. With no listener
 * registered, Capacitor's native bridge handles Back itself --
 * `WebView.goBack()` if there's WebView history, otherwise minimizing
 * the app outright -- entirely bypassing the page's JS and thus this
 * screen's `popstate` handler. That's why the dialog never appeared.
 * Registering `App.addListener("backButton", ...)` intercepts the
 * event before that native default fires.
 */
export function useLeaveRoundBackGuard(onBackAttempt: () => void) {
  // Read through a ref inside the listeners below so the browser and
  // native subscriptions only need to be set up once per mount,
  // regardless of how often the caller's callback identity changes
  // across renders. Refs can't be written during render itself (see
  // the react-hooks/refs rule), so the ref is kept current from its
  // own effect instead -- by the time either listener can actually
  // fire (a real Back press, never during render), this effect has
  // always already run.
  const onBackAttemptRef = useRef(onBackAttempt);
  useEffect(() => {
    onBackAttemptRef.current = onBackAttempt;
  }, [onBackAttempt]);

  useEffect(() => {
    function handlePopState() {
      onBackAttemptRef.current();
      window.history.pushState(null, "", window.location.href);
    }
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    let removeBackButtonListener: (() => void) | undefined;
    let cancelled = false;

    if (Capacitor.isNativePlatform()) {
      import("@capacitor/app").then(({ App }) => {
        if (cancelled) return;
        App.addListener("backButton", () => {
          onBackAttemptRef.current();
        }).then((handle) => {
          if (cancelled) {
            handle.remove();
            return;
          }
          removeBackButtonListener = () => handle.remove();
        });
      });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("popstate", handlePopState);
      removeBackButtonListener?.();
    };
  }, []);
}
