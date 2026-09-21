// components/final-results/FinalResultsScreen.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { History, Home, RotateCcw } from "lucide-react";
import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import RoundPreparationHeader from "@/shared/ui/RoundPreparationHeader";
import LeaveRoundDialog from "@/shared/ui/LeaveRoundDialog";
import VoteResultsCard from "@/components/results/VoteResultsCard";
import WinnerHero from "./WinnerHero";
import SecretRevealCard from "./SecretRevealCard";
import ImpostersRevealCard from "./ImpostersRevealCard";
import PlayerResultsList from "./PlayerResultsList";
import FinalRoundSummaryCard from "./FinalRoundSummaryCard";
import VotingHistoryDialog from "./VotingHistoryDialog";
import AchievementsUnlockedBanner from "./AchievementsUnlockedBanner";
import AchievementUnlockToast from "@/components/achievements/AchievementUnlockToast";
import { clearStoredRoundSession, getStoredRoundSession } from "@/entities/round";
import { recordFinalResult } from "@/entities/statistics";
import {
  processAchievementsForCompletedGame,
  type UnlockedAchievementEvent,
} from "@/lib/achievements/store";
import { analytics } from "@/lib/analytics";
import { isVotingComplete } from "@/features/play-round";
import { getHighestVoteCount } from "@/features/play-round";
import type { RoundSession } from "@/game/game-types";
import {
  getFinalImposters,
  getFinalOutcome,
  getFinalPlayerResults,
  getFinalVoteTally,
  getFinalVotingHistory,
  getRoundSummary,
  getWinReason,
} from "@/features/play-round";
import { light, success } from "@/shared/lib/haptics";
import { playSound } from "@/shared/lib/sound-engine";
import { useLeaveRoundBackGuard } from "@/lib/use-leave-round-back-guard";

export default function FinalResultsScreen() {
  const router = useRouter();

  // Read the stored round once, synchronously, as the initial state --
  // the redirect checks below key off this same value and never call
  // setSession themselves, so there's no extra render on mount.
  const [session] = useState<RoundSession | null>(() =>
    getStoredRoundSession(),
  );
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [showVotingHistory, setShowVotingHistory] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<
    UnlockedAchievementEvent[]
  >([]);
  const recordedRef = useRef<string | null>(null);
  const outcomeSoundPlayedRef = useRef(false);

  useEffect(() => {
    if (session === null) {
      router.replace("/round");
      return;
    }

    if (session.status === "ready") {
      router.replace("/pass");
      return;
    }

    if (!isVotingComplete(session)) {
      router.replace("/voting");
      return;
    }

    if (getFinalOutcome(session) === null) {
      router.replace("/results");
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLeaveRoundBackGuard(openLeaveConfirmation);

  // Handle side-effects (stats and sound) safely inside a useEffect
  useEffect(() => {
    if (!session) return;
    const outcome = getFinalOutcome(session);
    if (outcome === null) return;

    // 1. Record Final Result, then evaluate Achievements against the
    // now-updated game history.
    if (recordedRef.current !== session.id) {
      recordedRef.current = session.id;
      // Fire-and-forget from this effect's point of view (the screen
      // never awaits or blocks on it), but internally sequenced:
      // `recordFinalResult` must land in `completedGames` (see
      // lib/db.ts's `recordCompletedGame`) BEFORE achievement
      // evaluation reads that same table (spec section 13's pipeline:
      // Completed Game -> Statistics -> Achievement Evaluation), or a
      // player's very own just-finished game wouldn't count toward
      // their own achievements yet. Both steps already report their
      // own failures internally and never throw -- a failed write here
      // must never surface an error on a screen whose game is already
      // over. Also naturally idempotent even without this
      // `recordedRef` guard (Dexie `put` against `session.id`), but the
      // guard still avoids re-running the whole sequence (and the
      // analytics event right below) more than once per rendered
      // session.
      void (async () => {
        await recordFinalResult(session, outcome);
        const newlyUnlocked = await processAchievementsForCompletedGame(
          session,
        );
        setUnlockedAchievements(newlyUnlocked);
      })();
      // Same idempotency guard as the statistics write above -- fires
      // exactly once per finished game, never on a rerender or refresh
      // of this screen.
      analytics.gameCompleted({
        playerCount: session.players.length,
        mode: session.config.mode,
        winner: outcome,
      });
    }

    // 2. Play Outcome Sound (+ matching Success haptic for either win --
    // Crew victory and Imposter victory are visually/audibly distinct,
    // but both are a "success" from the haptic vocabulary's point of
    // view). Gated on the same ref as the sound so this can never
    // double-fire across re-renders.
    if (!outcomeSoundPlayedRef.current) {
      outcomeSoundPlayedRef.current = true;
      playSound(
        outcome === "crew-win" ? "result-crew-wins" : "result-imposter-wins",
      );
      success();
    }
  }, [session]);

  if (!session) return null;

  const outcome = getFinalOutcome(session);
  if (outcome === null) return null;

  const reason = getWinReason(session, outcome);
  const playerResults = getFinalPlayerResults(session);
  const imposters = getFinalImposters(session);
  const tally = getFinalVoteTally(session);
  const highestVotes = getHighestVoteCount(tally);
  const summary = getRoundSummary(session);
  const votingHistory = getFinalVotingHistory(session);

  function openLeaveConfirmation() {
    setConfirmingLeave(true);
  }

  function handleLeaveConfirmed() {
    clearStoredRoundSession();
    router.push("/players");
  }

  function handlePlayAgain() {
    playSound("ui-tap");
    light();
    clearStoredRoundSession();
    router.push("/players");
  }

  function handleBackToHome() {
    playSound("ui-tap");
    clearStoredRoundSession();
    router.push("/");
  }

  return (
    <div className="relative flex min-h-dvh w-full justify-center">
      <SpaceBackdrop />
      <AchievementUnlockToast events={unlockedAchievements} />

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

          <AchievementsUnlockedBanner count={unlockedAchievements.length} />

          <button
            type="button"
            onClick={() => {
              playSound("ui-tap");
              light();
              setShowVotingHistory(true);
            }}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-iw-border bg-iw-surface-2 px-6 py-3.5 font-display text-sm font-bold text-iw-ink-100 transition-colors hover:border-iw-border-strong"
          >
            <History className="h-4 w-4" aria-hidden="true" />
            VOTING HISTORY
          </button>

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

      {showVotingHistory && (
        <VotingHistoryDialog
          history={votingHistory}
          players={session.players}
          onClose={() => {
            playSound("ui-tap");
            light();
            setShowVotingHistory(false);
          }}
        />
      )}
    </div>
  );
}
