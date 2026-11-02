"use client";

import { useSyncExternalStore } from "react";
import {
  subscribeConnectivity,
  getConnectivitySnapshot,
  getConnectivityServerSnapshot,
} from "./connectivity";

/**
 * Live connectivity value, re-rendering on change. Originally lived
 * inline in components/home/ConnectionStatus.tsx; pulled out here so
 * it can also back UI that needs to know connectivity for reasons
 * other than the cosmetic indicator (there aren't any yet, but this
 * keeps there from being two competing implementations if that
 * changes).
 *
 * Backed by lib/connectivity.ts, which reads browser online/offline
 * events on the web and the Capacitor Network plugin inside the
 * native Android app -- see that module for why the two platforms
 * need different underlying sources. Both expose the same
 * true/false "online" shape here, so this hook itself doesn't need to
 * know or care which platform it's running on.
 *
 * The actual offline-*navigation* decision (see
 * lib/offline-navigation.ts) intentionally reads `navigator.onLine`
 * directly rather than through this hook, since that's a one-off check
 * at click time, not something a component needs to re-render on.
 */
export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribeConnectivity,
    getConnectivitySnapshot,
    getConnectivityServerSnapshot,
  );
}
