"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own flag for "launched from Home Screen"
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * Surfaces whatever install affordance the current browser actually
 * supports, and nothing more:
 * - Chrome/Edge/Android: captures beforeinstallprompt so a button can
 *   trigger the native prompt on demand.
 * - iOS Safari: no programmatic prompt exists, so we just expose
 *   `isIosNotStandalone` for a "Tap Share -> Add to Home Screen" hint.
 * - Android/desktop browsers that support installation but haven't
 *   fired `beforeinstallprompt` yet (or don't support it at all):
 *   `isAndroid` lets a caller pick platform-appropriate manual
 *   instructions instead of a broken button.
 * - Already installed / unsupported browser: everything stays false so
 *   the minimal caller (InstallAppButton) renders nothing.
 *
 * `outcome` reflects the result of the most recent `promptInstall()`
 * call ("accepted" | "dismissed" | null before any attempt) so a caller
 * like the Settings screen can show a brief success message. Once
 * `deferredPrompt` is consumed it's never reused -- per spec, a
 * dismissal is not repeatedly re-prompted; the browser may fire a fresh
 * `beforeinstallprompt` later on its own schedule.
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [outcome, setOutcome] = useState<"accepted" | "dismissed" | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInstalled(isStandalone());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome: result } = await deferredPrompt.userChoice;
    setOutcome(result);
    if (result === "accepted") {
      setInstalled(true);
    }
    // The captured event can only ever be used once -- discard it
    // regardless of outcome so a stale reference is never re-prompted.
    setDeferredPrompt(null);
  };

  return {
    canInstall: !installed && deferredPrompt !== null,
    isIosNotStandalone: !installed && isIos() && deferredPrompt === null,
    isAndroid: isAndroid(),
    installed,
    outcome,
    promptInstall,
  };
}
