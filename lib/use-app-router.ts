"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { navigateInternal } from "@/lib/offline-navigation";

/**
 * Drop-in replacement for next/navigation's `useRouter` for the game's
 * internal screen-to-screen navigation.
 *
 * Online: behaves exactly like the real router (push/replace are passed
 * straight through).
 *
 * Offline: `push`/`replace` to a known app route (see lib/app-routes.ts)
 * instead force a full document navigation via `window.location`, since
 * App Router's client-side transitions need a live network round-trip
 * for their RSC payload and won't reliably fall back to a document
 * navigation on failure. See lib/offline-navigation.ts for the full
 * explanation and public/sw-template.js for how the resulting document
 * request gets served from the precache.
 *
 * Every screen that used to call `useRouter()` from "next/navigation"
 * for its own push/replace calls uses this instead; nothing else about
 * those call sites changes.
 */
export function useAppRouter() {
  const router = useRouter();

  return useMemo(
    () => ({
      push: (href: string) => {
        if (navigateInternal(href, false)) return;
        router.push(href);
      },
      replace: (href: string) => {
        if (navigateInternal(href, true)) return;
        router.replace(href);
      },
      back: () => router.back(),
    }),
    [router],
  );
}
