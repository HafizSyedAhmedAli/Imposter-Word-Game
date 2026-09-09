// components/final-results/VotingHistoryDialog.tsx
"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, History } from "lucide-react";
import type { Player, VotingHistoryEntry } from "@/game/game-types";
import VotingHistoryRoundCard from "./VotingHistoryRoundCard";

/**
 * Read-only review of every completed voting round from this game,
 * opened from the Final Results screen's "Voting History" option. Built
 * on the native <dialog> element for the same reason
 * components/pass/LeaveRoundDialog.tsx is: showModal() gives focus
 * trapping, an inert background, and Escape-to-close for free per the
 * HTML spec. Unlike that dialog, this one can hold an unbounded number
 * of rounds, so it fills the viewport and scrolls its own content
 * instead of centering a fixed-size card.
 *
 * Purely presentational -- it never mutates `RoundSession`. The parent
 * (FinalResultsScreen) mounts this only while its own local
 * "show history" state is true, same "mounted === open" convention as
 * LeaveRoundDialog.
 */
export default function VotingHistoryDialog({
  history,
  players,
  onClose,
}: {
  history: VotingHistoryEntry[];
  players: Player[];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    dialog.showModal();
    closeButtonRef.current?.focus();

    // Route Escape ("cancel") through the same onClose the back button
    // uses, rather than letting the dialog close out from under React
    // state -- identical pattern to LeaveRoundDialog.
    function handleCancel(event: Event) {
      event.preventDefault();
      onClose();
    }
    dialog.addEventListener("cancel", handleCancel);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.close();
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="voting-history-heading"
      className="m-0 h-dvh max-h-dvh w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-iw-void/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-iw-void">
        <header className="flex shrink-0 items-center gap-3 px-4 pt-safe pl-safe pr-safe sm:px-6 sm:pt-6">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Back to final results"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-iw-border bg-iw-surface/60 text-iw-ink-100 backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-iw-border-strong hover:bg-iw-surface-2 active:translate-y-0 active:scale-95 cursor-pointer"
          >
            <ArrowLeft
              className="h-5 w-5"
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </button>
          <h2
            id="voting-history-heading"
            className="font-display text-lg font-bold text-iw-ink-100"
          >
            VOTING HISTORY
          </h2>
        </header>

        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 overflow-y-auto px-4 pb-safe pl-safe pr-safe py-6 sm:px-6">
          {history.length === 0 ? (
            <div className="animate-iw-fade-up flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <History className="h-8 w-8 text-iw-ink-500" aria-hidden="true" />
              <p className="text-sm text-iw-ink-500">
                No voting rounds were recorded for this game.
              </p>
            </div>
          ) : (
            history.map((entry) => (
              <VotingHistoryRoundCard
                key={entry.round}
                entry={entry}
                players={players}
              />
            ))
          )}
        </main>
      </div>
    </dialog>
  );
}
