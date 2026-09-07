"use client";

import { useEffect } from "react";
import { analytics } from "@/lib/analytics";

/**
 * Mounted once in the root layout (same convention as
 * ServiceWorkerRegister/SoundProvider/MenuMusicController) so the real
 * browser `appinstalled` event is captured regardless of which screen
 * the player happens to be on -- `useInstallPrompt`'s own listener
 * (lib/use-install-prompt.ts) only exists while a component using that
 * hook (InstallAppButton, on the Settings screen) is mounted, which
 * isn't a reliable place to observe a lifetime, one-time event like
 * this.
 *
 * Renders nothing and shows no UI -- see spec: "Do not create a visible
 * component."
 */
export default function PwaInstallAnalytics() {
  useEffect(() => {
    const handleInstalled = () => {
      analytics.pwaInstalled();
    };

    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  return null;
}
