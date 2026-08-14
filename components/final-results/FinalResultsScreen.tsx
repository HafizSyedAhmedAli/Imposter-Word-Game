// components/final-results/FinalResultsScreen.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, RotateCcw } from "lucide-react";
import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import RoundPreparationHeader from "@/components/round/RoundPreparationHeader";
import LeaveRoundDialog from "@/components/pass/LeaveRoundDialog";
import VoteResultsCard from "@/components/results/VoteResultsCard";
import VerdictCard from "@/components/results/VerdictCard";
import WinnerHero from "./WinnerHero";
import SecretRevealCard from "./SecretRevealCard";
import ImpostersRevealCard from "./ImpostersRevealCard";
import PlayerResultsList from "./PlayerResultsList";
import FinalRoundSummaryCard from "./FinalRoundSummaryCard";
import {
  clearStoredRoundSession,
  getStoredRoundSession,
} from "@/lib/round-session-store";
import { recordFinalResult } from "@/lib/game-statistics-store";
import { isVotingComplete } from "@/game/vote-flow";
import {
  getHighestVoteCount,
  getTotalImposterCount,
} from "@/game/results-flow";
import type { RoundSession } from "@/game/game-types";
import {
  getFinalImposters,
  getFinalOutcome,
  getFinalPlayerResults,
  getFinalVerdict,
  getFinalVoteTally,
  getRoundSummary,
  getWinReason,
} from "@/game/final-results-flow";

/**
 * Screen 9 -- the FINAL RESULTS screen. Reached only from ResultsScreen's
 * (Screen 8) "SEE FINAL RESULTS" button once game/results-flow.ts's
 * getRoundOutcome() is no longer "continue". Every fact rendered here
 * (word, hint, imposters, verdict, vote tally, config) is read straight
 * off the persisted RoundSession via game/final-results-flow.ts -- this
 * screen makes no gameplay decisions of its own (spec's "GAME OUTCOME
 * LOGIC": do not create a second source of truth).
 *
 * Note on scope: this codebase has no "final guess" mechanic (only
 * vote-based elimination -- see game/game-types.ts and the comment atop
 * game/final-results-flow.ts), so there is deliberately no FINAL GUESS
 * card here. Adding one later only requires a new card fed by a new
 * field on RoundSession; nothing else on this screen would change.
 */
export default function FinalResultsScreen() {
  const router = useRouter();

  // Same deterministic-null-then-hydrate pattern as ResultsScreen --
  // sessionStorage doesn't exist during the server render.
  const [session, setSession] = useState<RoundSession | null>(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const recordedRef = useRef(false); // guards double-recording stats in Strict Mode

  useEffect(() => {
    const existing = getStoredRoundSession();

    if (existing === null) {
      // Deep-linked straight to /final-results with no round in progress.
      router.replace("/round");
      return;
    }

    if (existing.status === "ready") {
      // Voting hasn't even started -- nothing to show here yet.
      router.replace("/pass");
      return;
    }

    if (!isVotingComplete(existing)) {
      router.replace("/voting");
      return;
    }

    if (getFinalOutcome(existing) === null) {
      // Voting for this round finished, but the game itself hasn't --
      // Screen 8 owns "continue this round" navigation, not this screen
      // (spec's "IMPORTANT NAVIGATION RULE": never render a false
      // game-over for a deep link, stale tab, or back/forward race).
      router.replace("/results");
      return;
    }

    setSession(existing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same hardware/browser-back guard as every other in-round screen --
  // it must go through the leave-round confirmation, never silently
  // discard the completed round (spec's HEADER section).
  useEffect(() => {
    function handlePopState() {
      openLeaveConfirmation();
      window.history.pushState(null, "", window.location.href);
    }
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (!session) return null;

  const outcome = getFinalOutcome(session);
  if (outcome === null) return null; // redirect above is already in flight

  // Rolls this game into the lifetime stats exactly once. recordFinalResult
  // is itself idempotent per session.id (see lib/game-statistics-store.ts),
  // so this ref only avoids a redundant localStorage read/write on Strict
  // Mode's double-invoke -- a refresh of this screen still can't double
  // count (spec: "A refresh of Screen 9 must NOT increment statistics
  // again").
  if (!recordedRef.current) {
    recordFinalResult(session, outcome);
    recordedRef.current = true;
  }

  const reason = getWinReason(session, outcome);
  const playerResults = getFinalPlayerResults(session);
  const imposters = getFinalImposters(session);
  const impostersCaught = imposters.filter((i) => i.eliminated).length;
  const verdict = getFinalVerdict(session);
  const tally = getFinalVoteTally(session);
  const highestVotes = getHighestVoteCount(tally);
  const totalImposters = getTotalImposterCount(session);
  const summary = getRoundSummary(session);

  function openLeaveConfirmation() {
    setConfirmingLeave(true);
  }

  function handleLeaveConfirmed() {
    clearStoredRoundSession();
    router.push("/players");
  }

  function handlePlayAgain() {
    // Fresh game state next time -- never carry votes, eliminations,
    // roles, word, hint, or currentPlayerIndex into the next round
    // (spec's "ROUND DATA CLEANUP"). This only clears the sessionStorage
    // round session; the IndexedDB AI word cache, fallback word list,
    // user settings, and statistics all live in separate stores and are
    // left untouched. Same roster/config screen ResultsScreen's own
    // "leave round" action uses, so players don't have to re-enter names
    // to start a new round.
    clearStoredRoundSession();
    router.push("/players");
  }

  function handleBackToHome() {
    clearStoredRoundSession();
    router.push("/");
  }

  return (
    <div className="relative flex min-h-dvh w-full justify-center">
      <SpaceBackdrop />

      <div className="flex w-full max-w-[1400px] flex-col px-4 pl-safe pr-safe pt-safe pb-safe sm:px-6 sm:py-8">
        <RoundPreparationHeader onBack={openLeaveConfirmation} />

        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 py-6">
          <WinnerHero outcome={outcome} reason={reason} />

          <SecretRevealCard
            word={session.round.word}
            hint={session.round.hint}
          />

          <ImpostersRevealCard imposters={imposters} />

          <PlayerResultsList results={playerResults} />

          {verdict.type !== "tie" && (
            <VerdictCard
              playerName={verdict.eliminated.name}
              wasImposter={verdict.type === "imposter-caught"}
              remainingImposterCount={
                outcome === "crew-win" ? 0 : totalImposters - impostersCaught
              }
            />
          )}

          <VoteResultsCard tally={tally} highestVotes={highestVotes} />

          <FinalRoundSummaryCard summary={summary} />

          <div className="mt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={handlePlayAgain}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            >
              PLAY AGAIN
              <RotateCcw
                className="h-5 w-5"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={handleBackToHome}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-iw-border bg-iw-surface-2 px-6 py-3.5 font-display text-sm font-bold text-iw-ink-100 transition-colors hover:border-iw-border-strong"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              BACK TO HOME
            </button>
          </div>
        </main>
      </div>

      {confirmingLeave && (
        <LeaveRoundDialog
          onCancel={() => setConfirmingLeave(false)}
          onConfirm={handleLeaveConfirmed}
        />
      )}
    </div>
  );
}
