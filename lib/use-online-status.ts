"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

// Assume online during SSR / before hydration -- this is only a cosmetic
// indicator, never a gate on functionality.
function getServerSnapshot() {
  return true;
}

/**
 * Live `navigator.onLine` value, re-rendering on change. Originally
 * lived inline in components/home/ConnectionStatus.tsx; pulled out here
 * so it can also back UI that needs to know connectivity for reasons
 * other than the cosmetic indicator (there aren't any yet, but this
 * keeps there from being two competing implementations if that
 * changes). The actual offline-*navigation* decision (see
 * lib/offline-navigation.ts) intentionally reads `navigator.onLine`
 * directly rather than through this hook, since that's a one-off check
 * at click time, not something a component needs to re-render on.
 */
export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
