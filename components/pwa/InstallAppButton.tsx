"use client";

import { Download, Share } from "lucide-react";
import { useInstallPrompt } from "@/lib/use-install-prompt";

/**
 * Renders nothing unless installation is actually possible or useful:
 * - Chrome/Edge/Android with a captured beforeinstallprompt -> a real
 *   button that triggers the native install flow.
 * - iOS Safari (no install API) -> a tiny "Tap Share -> Add to Home
 *   Screen" hint, since that's the only path there.
 * - Already installed, or unsupported browser -> nothing.
 */
export default function InstallAppButton() {
  const { canInstall, isIosNotStandalone, promptInstall } = useInstallPrompt();

  if (canInstall) {
    return (
      <button
        type="button"
        onClick={promptInstall}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-iw-border bg-iw-surface/70 px-3 py-1.5 text-xs font-semibold text-iw-ink-300 backdrop-blur-sm transition-colors hover:border-iw-border-strong hover:bg-iw-surface-2 hover:text-iw-ink-100"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Install App
      </button>
    );
  }

  if (isIosNotStandalone) {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-iw-ink-600">
        <Share className="h-3.5 w-3.5" aria-hidden="true" />
        Tap Share, then &quot;Add to Home Screen&quot;
      </p>
    );
  }

  return null;
}
