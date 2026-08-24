"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearActiveGameRecovery,
  getRecoverableActiveGame,
} from "@/lib/active-game-recovery";
import {
  getStoredRoundSession,
  storeRoundSession,
} from "@/lib/round-session-store";

/**
 * Screen 1 (Home) mounts this alongside its normal content. It renders
 * nothing until its mount effect confirms there's actually an unfinished
 * game to recover -- most launches never show anything here.
 *
 * Deliberately checks localStorage (lib/active-game-recovery.ts), not
 * sessionStorage: sessionStorage already survives refresh/offline/lock
 * on its own (see lib/round-session-store.ts), so if it's empty here,
 * this really is a fresh launch after a full close, which is the one
 * gap this component exists to cover.
 */
export default function GameRecoveryPrompt() {
  const router = useRouter();
  // Compute the initial value synchronously via a lazy initializer
  // instead of setting it from inside an effect -- avoids an extra
  // render on mount for what is otherwise a pure read of two storage
  // APIs.
  const [record, setRecord] = useState<ReturnType<
    typeof getRecoverableActiveGame
  > | null>(() => {
    // If sessionStorage still has a live round, this tab never actually
    // lost it (e.g. a deep link to "/" mid-game) -- nothing to recover,
    // the existing in-round screens already handle that case.
    if (getStoredRoundSession() !== null) return null;

    return getRecoverableActiveGame();
  });
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !record) return;

    dialog.showModal();

    function handleCancel(event: Event) {
      // No neutral "just close" action here -- leaving it open is safer
      // than silently discarding or silently resuming a pass-the-phone
      // game, so Escape is a no-op rather than a third hidden choice.
      event.preventDefault();
    }
    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.close();
    };
  }, [record]);

  if (!record) return null;

  function handleResume() {
    if (!record) return;
    // Restores the exact saved RoundSession back into sessionStorage --
    // same word/hint/roles/currentPlayerIndex/votes/eliminatedPlayerIds
    // as when the app was closed. Nothing is regenerated and no new
    // round is created; this is the same storeRoundSession() every
    // other screen already uses, so it also re-mirrors into
    // localStorage, keeping the two stores in sync.
    storeRoundSession(record.session);
    router.push(record.route);
  }

  function handleStartNew() {
    // Only the active game/session state is discarded here -- saved
    // words, custom words, settings, and statistics all live in
    // separate Dexie/localStorage stores (lib/db.ts,
    // lib/settings-store.ts, lib/game-statistics-store.ts) and are
    // never touched by this action.
    clearActiveGameRecovery();
    setRecord(null);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="game-recovery-heading"
      aria-describedby="game-recovery-description"
      className="m-0 max-w-none border-0 bg-transparent p-0 backdrop:bg-iw-void/70 backdrop:backdrop-blur-sm"
    >
      <div className="fixed inset-0 flex items-center justify-center px-6">
        <div className="animate-iw-fade-up w-full max-w-sm rounded-3xl border border-iw-border bg-iw-surface p-6 text-center">
          <h2
            id="game-recovery-heading"
            className="font-display text-lg font-bold text-iw-ink-100"
          >
            Game in Progress
          </h2>
          <p
            id="game-recovery-description"
            className="mt-2 text-sm text-iw-ink-500"
          >
            You have an unfinished game.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleResume}
              className="w-full cursor-pointer rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-3 font-display text-sm font-bold text-iw-gold-ink"
            >
              RESUME GAME
            </button>
            <button
              type="button"
              onClick={handleStartNew}
              className="w-full cursor-pointer rounded-2xl border border-iw-border bg-iw-surface-2 px-6 py-3 font-display text-sm font-bold text-iw-ink-100 transition-colors hover:border-iw-border-strong"
            >
              START NEW GAME
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
