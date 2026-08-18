// components/final-results/FinalResultsScreen.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, RotateCcw } from "lucide-react";
import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import RoundPreparationHeader from "@/components/round/RoundPreparationHeader";
import LeaveRoundDialog from "@/components/pass/LeaveRoundDialog";
import VoteResultsCard from "@/components/results/VoteResultsCard";
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
import { getHighestVoteCount } from "@/game/results-flow";
import type { RoundSession } from "@/game/game-types";
import {
  getFinalImposters,
  getFinalOutcome,
  getFinalPlayerResults,
  getFinalVoteTally,
  getRoundSummary,
  getWinReason,
} from "@/game/final-results-flow";
import { playSound } from "@/lib/sound-engine";

export default function FinalResultsScreen() {
  const router = useRouter();

  const [session, setSession] = useState<RoundSession | null>(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const recordedRef = useRef(false);
  const outcomeSoundPlayedRef = useRef(false);

  useEffect(() => {
    const existing = getStoredRoundSession();

    if (existing === null) {
      router.replace("/round");
      return;
    }

    if (existing.status === "ready") {
      router.replace("/pass");
      return;
    }

    if (!isVotingComplete(existing)) {
      router.replace("/voting");
      return;
    }

    if (getFinalOutcome(existing) === null) {
      router.replace("/results");
      return;
    }

    setSession(existing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  if (outcome === null) return null;

  if (!recordedRef.current) {
    recordFinalResult(session, outcome);
    recordedRef.current = true;
  }

  // Same once-per-mount guard as the stats recording just above --
  // this only ever fires the first time this session's outcome is
  // rendered, never again on a refresh of this same finished round.
  if (!outcomeSoundPlayedRef.current) {
    outcomeSoundPlayedRef.current = true;
    playSound(
      outcome === "crew-win" ? "result-crew-wins" : "result-imposter-wins",
    );
  }

  const reason = getWinReason(session, outcome);
  const playerResults = getFinalPlayerResults(session);
  const imposters = getFinalImposters(session);
  const tally = getFinalVoteTally(session);
  const highestVotes = getHighestVoteCount(tally);
  const summary = getRoundSummary(session);

  function openLeaveConfirmation() {
    setConfirmingLeave(true);
  }

  function handleLeaveConfirmed() {
    clearStoredRoundSession();
    router.push("/players");
  }

  function handlePlayAgain() {
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
