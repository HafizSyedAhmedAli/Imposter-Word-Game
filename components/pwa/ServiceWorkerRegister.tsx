"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Capacitor } from "@capacitor/core";

export default function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Running as the native app (Android/iOS) -- assets are already
    // bundled locally by Capacitor, so there's nothing for a service
    // worker to usefully cache, and update delivery goes through the
    // app store instead of this banner.
    if (Capacitor.isNativePlatform()) return;
    if (!("serviceWorker" in navigator)) return;
    if (!window.isSecureContext) return;

    let cancelled = false;

    const hadControllerOnLoad = Boolean(navigator.serviceWorker.controller);

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (cancelled) return;
        if (registration.waiting && registration.active) {
          setWaitingWorker(registration.waiting);
          setUpdateReady(true);
        }
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && registration.active) {
              setWaitingWorker(installing);
              setUpdateReady(true);
            }
          });
        });
      })
      .catch(() => {});

    let refreshing = false;
    const onControllerChange = () => {
      if (!hadControllerOnLoad) return;
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  if (!updateReady) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-safe"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mb-3 flex w-full max-w-md items-center gap-3 rounded-2xl border border-iw-border-strong bg-iw-surface-2/95 px-4 py-3 text-sm text-iw-ink-100 shadow-lg backdrop-blur-sm">
        <RefreshCw
          className="h-4 w-4 shrink-0 text-iw-gold-400"
          aria-hidden="true"
        />
        <p className="flex-1 leading-snug">
          A new version of Imposter Word is ready. It&apos;ll apply next time
          you&apos;re back at the Home screen.
        </p>
        <button
          type="button"
          onClick={() => {
            waitingWorker?.postMessage("SKIP_WAITING");
            setUpdateReady(false);
          }}
          className="shrink-0 rounded-full bg-iw-gold-500 px-3 py-1.5 text-xs font-semibold text-iw-gold-ink transition-colors hover:bg-iw-gold-400"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => setUpdateReady(false)}
          aria-label="Dismiss"
          className="shrink-0 text-iw-ink-500 hover:text-iw-ink-100"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
