// components/results/ResultsScreen.tsx
"use client";

import { isVotingComplete } from "@/game/vote-flow"; // add this import
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Trophy } from "lucide-react";
import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import RoundPreparationHeader from "@/components/round/RoundPreparationHeader";
import LeaveRoundDialog from "@/components/pass/LeaveRoundDialog";
import {
  clearStoredRoundSession,
  getStoredRoundSession,
  storeRoundSession,
} from "@/lib/round-session-store";
import type { RoundSession } from "@/game/game-types";
import {
  applyVerdict,
  continueRound,
  getEliminatedPlayerIds,
  getHighestVoteCount,
  getRoundOutcome,
  getTotalImposterCount,
  getVerdict,
  getVoteTally,
} from "@/game/results-flow";
import VoteResultsCard from "./VoteResultsCard";
import MostVotedCard from "./MostVotedCard";
import VerdictCard from "./VerdictCard";
import TieCard from "./TieCard";

export default function ResultsScreen() {
  const router = useRouter();

  // Same deterministic-null-then-hydrate pattern as VoteScreen/PassPhoneScreen
  // -- sessionStorage doesn't exist during the server render.
  const [session, setSession] = useState<RoundSession | null>(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const appliedRef = useRef(false); // guards double-applying the verdict in Strict Mode

  function handlePrimaryAction() {
    if (outcome === "continue") {
      // Resume THIS round -- same word/hint/roles, next discussion+vote
      // cycle, eliminated player(s) excluded from here on. This is
      // deliberately NOT prepareGameRound()/`/round` -- that path re-reads
      // the full original roster from useGameSetup and re-rolls fresh
      // imposters, which is what dropped the elimination on the floor.
      storeRoundSession(continueRound(session!));
      router.push("/game");
      return;
    }
    // crew-win / imposter-win: no dedicated final-results screen exists
    // yet (see app/statistics/page.tsx's own placeholder) -- home is the
    // safest real destination today.
    storeRoundSession({ ...session!, status: "finished" });
    router.push("/final-results");
  }

  useEffect(() => {
    const existing = getStoredRoundSession();

    if (existing === null) {
      // Deep-linked straight to /results with no round in progress.
      router.replace("/round");
      return;
    }

    if (existing.status === "ready") {
      // Voting hasn't started yet -- nothing to reveal.
      router.replace("/pass");
      return;
    }

    if (!isVotingComplete(existing)) {
      router.replace("/voting");
      return;
    }

    const withVerdictApplied = applyVerdict(existing);
    if (withVerdictApplied !== existing) {
      storeRoundSession(withVerdictApplied);
    }
    setSession(withVerdictApplied);
    appliedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same hardware/browser-back guard as every other in-round screen --
  // it must go through the leave-round confirmation, never silently
  // fall back into the voting flow (spec's HEADER section).
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

  const tally = getVoteTally(session);
  const highestVotes = getHighestVoteCount(tally);
  const verdict = getVerdict(session);
  const outcome = getRoundOutcome(session);
  const eliminatedPlayerIds = new Set(getEliminatedPlayerIds(session));
  const remainingImposters = session.round.roles.filter(
    (role) =>
      role.role === "imposter" && !eliminatedPlayerIds.has(role.playerId),
  ).length;

  function openLeaveConfirmation() {
    setConfirmingLeave(true);
  }

  function handleLeaveConfirmed() {
    clearStoredRoundSession();
    router.push("/players");
  }

  return (
    <div className="relative flex min-h-dvh w-full justify-center">
      <SpaceBackdrop />

      <div className="flex w-full max-w-[1400px] flex-col px-4 pl-safe pr-safe pt-safe pb-safe sm:px-6 sm:py-8">
        <RoundPreparationHeader onBack={openLeaveConfirmation} />

        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 py-6">
          <div className="animate-iw-fade-up flex flex-col items-center gap-2 text-center">
            <Sparkles className="h-6 w-6 text-iw-gold-400" aria-hidden="true" />
            <h1 className="font-display text-3xl font-bold text-iw-ink-100">
              THE RESULTS ARE IN!
            </h1>
            <p className="text-sm text-iw-ink-500">
              Let&apos;s see who the group suspected...
            </p>
          </div>

          <VoteResultsCard tally={tally} highestVotes={highestVotes} />

          {verdict.type === "tie" ? (
            <TieCard tied={verdict.tied} />
          ) : (
            <>
              <MostVotedCard
                name={verdict.eliminated.name}
                index={
                  tally.find((t) => t.player.id === verdict.eliminated.id)
                    ?.index ?? 0
                }
                votes={highestVotes}
              />
              <VerdictCard
                playerName={verdict.eliminated.name}
                wasImposter={verdict.type === "imposter-caught"}
                remainingImposterCount={remainingImposters}
              />
            </>
          )}

          <button
            type="button"
            onClick={handlePrimaryAction}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            {outcome === "continue" ? (
              <>
                CONTINUE
                <ArrowRight
                  className="h-5 w-5"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </>
            ) : (
              <>
                SEE FINAL RESULTS
                <Trophy
                  className="h-5 w-5"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </>
            )}
          </button>
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
