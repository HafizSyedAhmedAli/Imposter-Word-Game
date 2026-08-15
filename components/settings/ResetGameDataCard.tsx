"use client";

import { Trash2, CheckCircle2 } from "lucide-react";
import type { ResetStatus } from "./SettingsScreen";

export default function ResetGameDataCard({
  status,
  errorMessage,
  onRequestReset,
}: {
  status: ResetStatus;
  errorMessage: string | null;
  onRequestReset: () => void;
}) {
  const isResetting = status === "resetting";

  return (
    <section
      className="rounded-3xl border border-iw-border bg-iw-surface/40 p-4 backdrop-blur-sm animate-iw-fade-up sm:p-5"
      style={{ animationDelay: "40ms" }}
    >
      <h2 className="font-display text-lg font-semibold tracking-wide text-iw-ink-100 sm:text-xl">
        DATA & STORAGE
      </h2>
      <p className="mt-1 text-sm text-iw-ink-500">
        Everything below is saved only on this device, so it works fully
        offline.
      </p>

      <button
        type="button"
        onClick={onRequestReset}
        disabled={isResetting}
        className="mt-4 flex w-full items-center gap-4 rounded-2xl border border-iw-red/30 bg-iw-red/10 px-4 py-3.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:bg-iw-red/20 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-iw-red/15 text-iw-red">
          <Trash2 className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-display text-base font-semibold tracking-wide text-iw-red">
            {isResetting ? "RESETTING..." : "RESET GAME DATA"}
          </span>
          <span className="truncate text-sm text-iw-ink-500">
            Clear AI rounds, history and statistics
          </span>
        </span>
      </button>

      {status === "success" && (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 flex items-center gap-2 text-sm font-semibold text-iw-online"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Game data reset successfully.
        </p>
      )}

      {status === "error" && (
        <p role="alert" className="mt-3 text-sm font-semibold text-iw-red">
          {errorMessage ?? "Couldn't reset your game data. Please try again."}
        </p>
      )}
    </section>
  );
}
