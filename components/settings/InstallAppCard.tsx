"use client";

import {
  Download,
  Share2,
  CheckCircle2,
  MonitorSmartphone,
} from "lucide-react";
import { useInstallPrompt } from "@/lib/use-install-prompt";

/**
 * The "Install App" section of Settings. Never fakes an outcome --
 * every branch here reflects a real, currently-observable browser
 * state from useInstallPrompt (lib/use-install-prompt.ts):
 *
 *   installed          -> "App Installed" (no button, nothing to do)
 *   canInstall         -> real button wired to the native prompt
 *   isIosNotStandalone -> iOS has no install API; show manual steps
 *   otherwise          -> no native prompt available yet (Android
 *                         browsers that haven't fired
 *                         beforeinstallprompt, or desktop browsers
 *                         without install support); show a subtle,
 *                         platform-appropriate hint instead of a
 *                         broken button
 */
export default function InstallAppCard() {
  const {
    installed,
    canInstall,
    isIosNotStandalone,
    isAndroid,
    outcome,
    promptInstall,
  } = useInstallPrompt();

  return (
    <section
      className="rounded-3xl border border-iw-border bg-iw-surface/40 p-4 backdrop-blur-sm animate-iw-fade-up sm:p-5"
      style={{ animationDelay: "20ms" }}
    >
      <h2 className="font-display text-lg font-semibold tracking-wide text-iw-ink-100 sm:text-xl">
        APPLICATION
      </h2>
      <p className="mt-1 text-sm text-iw-ink-500">
        Install Imposter Word for a faster, full-screen experience.
      </p>

      <div className="mt-4">
        {installed ? (
          <div className="flex items-center gap-4 rounded-2xl border border-iw-online/30 bg-iw-online/10 px-4 py-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-iw-online/15 text-iw-online">
              <CheckCircle2
                className="h-5 w-5"
                strokeWidth={2.25}
                aria-hidden="true"
              />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-display text-base font-semibold tracking-wide text-iw-online">
                APP INSTALLED
              </span>
              <span className="truncate text-sm text-iw-ink-500">
                Imposter Word is already installed on this device.
              </span>
            </span>
          </div>
        ) : canInstall ? (
          <button
            type="button"
            onClick={promptInstall}
            className="flex w-full items-center gap-4 rounded-2xl border border-iw-violet-400/40 bg-iw-violet-500/10 px-4 py-3.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:bg-iw-violet-500/20 active:translate-y-0 active:scale-[0.98] cursor-pointer"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-iw-violet-500/15 text-iw-violet-300">
              <Download
                className="h-5 w-5"
                strokeWidth={2.25}
                aria-hidden="true"
              />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-display text-base font-semibold tracking-wide text-iw-violet-300">
                INSTALL APP
              </span>
              <span className="truncate text-sm text-iw-ink-500">
                Install Imposter Word on your device
              </span>
            </span>
          </button>
        ) : isIosNotStandalone ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-iw-border bg-iw-surface-2/60 px-4 py-3.5">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-iw-violet-500/15 text-iw-violet-300">
                <Share2
                  className="h-5 w-5"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-display text-base font-semibold tracking-wide text-iw-ink-100">
                  INSTALL APP
                </span>
                <span className="text-sm text-iw-ink-500">
                  Add Imposter Word to your Home Screen
                </span>
              </span>
            </div>
            <ol className="ml-1 list-inside list-decimal text-sm text-iw-ink-300 [&>li]:mt-1 first:[&>li]:mt-0">
              <li>Tap the Share button</li>
              <li>Select &quot;Add to Home Screen&quot;</li>
              <li>Tap &quot;Add&quot;</li>
            </ol>
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-2xl border border-iw-border bg-iw-surface-2/60 px-4 py-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-iw-violet-500/15 text-iw-violet-300">
              <MonitorSmartphone
                className="h-5 w-5"
                strokeWidth={2.25}
                aria-hidden="true"
              />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-display text-base font-semibold tracking-wide text-iw-ink-100">
                INSTALL APP
              </span>
              <span className="text-sm text-iw-ink-500">
                {isAndroid
                  ? 'Open your browser menu and choose "Install app" or "Add to Home screen."'
                  : "Look for an install icon in your browser's address bar, or check its menu for an install option."}
              </span>
            </span>
          </div>
        )}
      </div>

      {outcome === "accepted" && (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 flex items-center gap-2 text-sm font-semibold text-iw-online"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Imposter Word installed!
        </p>
      )}
    </section>
  );
}
