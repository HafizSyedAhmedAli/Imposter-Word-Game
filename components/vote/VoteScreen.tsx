"use client";

import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import LeaveRoundDialog from "@/components/pass/LeaveRoundDialog";
import RoundPreparationHeader from "@/components/round/RoundPreparationHeader";
import type { RoundSession } from "@/game/game-types";
import {
  getCurrentVoter,
  getEligibleVoteTargets,
  getVotingDuration,
  getVotingOrder,
  isVotingComplete,
  skipVote,
  submitVote,
  type VoteScreenState,
} from "@/game/vote-flow";
import { markActiveGameRoute } from "@/lib/active-game-recovery";
import {
  clearStoredRoundSession,
  getStoredRoundSession,
  storeRoundSession,
} from "@/lib/round-session-store";
import { playSound } from "@/lib/sound-engine";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import AllVotesCastCard from "./AllVotesCastCard";
import ConfirmVoteCard from "./ConfirmVoteCard";
import VoteRecordedCard from "./VoteRecordedCard";
import VoteSelectionCard from "./VoteSelectionCard";
import VotingPassPromptCard from "./VotingPassPromptCard";
import VotingTimer from "./VotingTimer";
import { useLeaveRoundBackGuard } from "@/lib/use-leave-round-back-guard";

export default function VoteScreen() {
  const router = useRouter();

  // Read the stored round once, synchronously, as the initial state --
  // the redirect checks below key off this same value and never call
  // setSession themselves, so there's no extra render on mount.
  const [session, setSession] = useState<RoundSession | null>(() => {
    const existing = getStoredRoundSession();
    return existing &&
      existing.status !== "ready" &&
      existing.status !== "finished"
      ? existing
      : null;
  });
  const [screenState, setScreenState] = useState<VoteScreenState>(() => {
    const existing = getStoredRoundSession();
    if (
      !existing ||
      existing.status === "ready" ||
      existing.status === "finished"
    ) {
      return "pass-phone";
    }
    return isVotingComplete(existing) ? "all-cast" : "pass-phone";
  });
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const advancingRef = useRef(false);

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

    if (existing.status === "finished") {
      router.replace("/");
      return;
    }

    markActiveGameRoute("/voting");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLeaveRoundBackGuard(openLeaveConfirmation);

  useEffect(() => {
    function handleVisibility() {
      if (
        document.visibilityState === "hidden" &&
        (screenState === "voting" || screenState === "confirm")
      ) {
        setSelectedTargetId(null);
        setScreenState("pass-phone");
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [screenState]);

  function handleRevealResults() {
    playSound("results-lose");
    router.push("/results");
  }

  const playerIndexById = useMemo(() => {
    const map = new Map<string, number>();
    if (session) {
      getVotingOrder(session).forEach((player, index) =>
        map.set(player.id, index),
      );
    }
    return map;
  }, [session]);

  if (!session) return null;

  const activeSession = session;
  const currentVoter = getCurrentVoter(activeSession);
  const votingDuration = getVotingDuration(activeSession);

  function handleReady() {
    setScreenState("voting");
    playSound("ui-tap");
  }

  function handleSelect(playerId: string) {
    setSelectedTargetId(playerId);
    playSound("ui-tap");
  }

  function handleCastVote() {
    if (!selectedTargetId) return;
    setScreenState("confirm");
    playSound("ui-tap");
  }

  function handleGoBack() {
    setScreenState("voting");
  }

  function handleConfirmVote() {
    if (advancingRef.current) return;
    if (!currentVoter || !selectedTargetId) return;
    advancingRef.current = true;

    const next = submitVote(activeSession, currentVoter.id, selectedTargetId);
    if (next === activeSession) {
      setSelectedTargetId(null);
      setScreenState("pass-phone");
      advancingRef.current = false;
      return;
    }
    storeRoundSession(next);
    setSession(next);
    setSelectedTargetId(null);
    setScreenState(isVotingComplete(next) ? "all-cast" : "recorded");
    playSound("ui-confirm");

    setTimeout(() => {
      advancingRef.current = false;
    }, 0);
  }

  /**
   * Manual "Skip Vote" -- available straight from the voting screen, no
   * confirm step needed since it isn't accusing anyone (lower stakes
   * than a real vote, unlike submitVote's flow).
   */
  function handleSkipVote() {
    if (advancingRef.current) return;
    if (!currentVoter) return;
    advancingRef.current = true;

    const next = skipVote(activeSession, currentVoter.id);
    if (next === activeSession) {
      advancingRef.current = false;
      return;
    }
    storeRoundSession(next);
    setSession(next);
    setSelectedTargetId(null);
    setScreenState(isVotingComplete(next) ? "all-cast" : "recorded");
    playSound("ui-confirm");

    setTimeout(() => {
      advancingRef.current = false;
    }, 0);
  }

  /**
   * The voting timer is per-voter (see the `key={currentVoter?.id}` on
   * <VotingTimer> below, which forces a full remount -- and therefore a
   * full reset -- the instant it becomes a new player's turn). So if
   * THIS voter's timer runs out, only THIS voter is skipped; everyone
   * else still gets their own full duration. This replaces the old
   * single whole-phase timer + group "Time's Up" summary entirely.
   */
  function handleVotingTimerExpire() {
    if (advancingRef.current) return;
    if (!currentVoter) return;
    if (isVotingComplete(activeSession)) return;
    advancingRef.current = true;

    const next = skipVote(activeSession, currentVoter.id);
    if (next === activeSession) {
      advancingRef.current = false;
      return;
    }
    storeRoundSession(next);
    setSession(next);
    setSelectedTargetId(null);
    setScreenState(isVotingComplete(next) ? "all-cast" : "recorded");
    // No extra sound here -- VotingTimer already plays "timer-end"
    // itself the moment it hits zero, before calling onExpire.

    setTimeout(() => {
      advancingRef.current = false;
    }, 0);
  }

  function openLeaveConfirmation() {
    setSelectedTargetId(null);
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

        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 py-6">
          {screenState !== "all-cast" && (
            <VotingTimer
              key={currentVoter?.id ?? "no-voter"}
              durationSeconds={votingDuration}
              onExpire={handleVotingTimerExpire}
            />
          )}

          {screenState === "pass-phone" && currentVoter && (
            <VotingPassPromptCard
              voterName={currentVoter.name}
              onReady={handleReady}
            />
          )}

          {screenState === "voting" && currentVoter && (
            <VoteSelectionCard
              voterName={currentVoter.name}
              eligibleTargets={getEligibleVoteTargets(
                activeSession,
                currentVoter.id,
              )}
              playerIndexById={playerIndexById}
              selectedTargetId={selectedTargetId}
              onSelect={handleSelect}
              onCastVote={handleCastVote}
              onSkip={handleSkipVote}
            />
          )}

          {screenState === "confirm" && currentVoter && selectedTargetId && (
            <ConfirmVoteCard
              targetName={
                getVotingOrder(activeSession).find(
                  (player) => player.id === selectedTargetId,
                )?.name ?? ""
              }
              onConfirm={handleConfirmVote}
              onGoBack={handleGoBack}
            />
          )}

          {screenState === "recorded" && currentVoter && (
            <VoteRecordedCard
              nextVoterName={currentVoter.name}
              onReady={handleReady}
            />
          )}

          {screenState === "all-cast" && (
            <AllVotesCastCard onRevealResults={handleRevealResults} />
          )}
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
