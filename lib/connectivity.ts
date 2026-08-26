"use client";

import { Capacitor } from "@capacitor/core";

type Listener = () => void;

const listeners = new Set<Listener>();

// Cached synchronous snapshot backing useOnlineStatus's
// useSyncExternalStore call. `navigator.onLine` is synchronous and
// good enough to seed the initial value everywhere; on native Android
// it's immediately replaced with a real reading from the Capacitor
// Network plugin once that resolves (see startNative below).
let cachedOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

function notify() {
  for (const listener of listeners) listener();
}

function setOnline(value: boolean) {
  if (cachedOnline === value) return;
  cachedOnline = value;
  notify();
}

let started = false;

/**
 * `navigator.onLine` / the browser `online`/`offline` events reflect
 * whether the device has *a* network interface, which is all the web
 * platform gives us -- close enough for a cosmetic indicator there.
 *
 * Inside a Capacitor Android WebView, though, `navigator.onLine` has
 * been observed to report stale/incorrect values after the device's
 * actual connectivity changes (e.g. staying "online" after Wi-Fi and
 * mobile data are both turned off), which is exactly the Android
 * Issue 3 bug this module exists to fix. The Capacitor Network plugin
 * talks to Android's ConnectivityManager directly instead, so it's
 * used there in place of the browser APIs.
 *
 * Only one underlying source is ever wired up, the first time
 * anything subscribes, for the lifetime of the page/app -- there's
 * nothing to tear down since connectivity is an app-wide concern, not
 * a per-component one, so this intentionally never unsubscribes.
 */
function start() {
  if (started) return;
  started = true;
  if (typeof window === "undefined") return;

  if (Capacitor.isNativePlatform()) {
    startNative();
    return;
  }

  window.addEventListener("online", () => setOnline(true));
  window.addEventListener("offline", () => setOnline(false));
}

function startNative() {
  import("@capacitor/network")
    .then(({ Network }) => {
      Network.getStatus()
        .then((status) => setOnline(status.connected))
        .catch(() => {});
      Network.addListener("networkStatusChange", (status) => {
        setOnline(status.connected);
      }).catch(() => {});
    })
    .catch(() => {
      // If the native plugin genuinely can't load, fall back to the
      // browser APIs rather than leaving the indicator permanently
      // stuck on its initial value.
      window.addEventListener("online", () => setOnline(true));
      window.addEventListener("offline", () => setOnline(false));
    });
}

export function subscribeConnectivity(listener: Listener) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getConnectivitySnapshot() {
  return cachedOnline;
}

// Assume online during SSR / before hydration -- this is only a
// cosmetic indicator, never a gate on functionality.
export function getConnectivityServerSnapshot() {
  return true;
}
