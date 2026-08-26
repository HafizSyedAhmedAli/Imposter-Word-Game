// components/pwa/NativeSplashScreenController.tsx
"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Hides the native Android splash screen once this component has
 * mounted client-side.
 *
 * Paired with `plugins.SplashScreen.launchAutoHide: false` in
 * capacitor.config.ts. Without that pairing, the plugin's default
 * auto-hide timer can fire before the WebView has actually painted the
 * Home screen -- the gap between "splash disappears" and "Home
 * appears" is the black flash Android Issue 2 reports. Calling
 * `hide()` ourselves, right after this component (mounted at the root
 * layout) has committed its first render, closes that gap instead of
 * guessing a fixed duration.
 *
 * No-op outside the native app -- the browser/PWA has no native splash
 * screen to hide, and `@capacitor/splash-screen` is only imported
 * dynamically so it's never pulled into the web bundle's initial
 * chunk.
 */
export default function NativeSplashScreenController() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    import("@capacitor/splash-screen").then(({ SplashScreen }) => {
      if (cancelled) return;
      void SplashScreen.hide();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
