// components/vote/VoteScreen.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  getActiveVotingOrder,
  getCurrentVoter,
  getEligibleVoteTargets,
  getVotesCastCount,
  getVotingDuration,
  getVotingOrder,
  isVotingComplete,
  submitVote,
  type VoteScreenState,
} from "@/game/vote-flow";
import VotingTimer from "./VotingTimer";
import VotingPassPromptCard from "./VotingPassPromptCard";
import VoteSelectionCard from "./VoteSelectionCard";
import ConfirmVoteCard from "./ConfirmVoteCard";
import VoteRecordedCard from "./VoteRecordedCard";
import AllVotesCastCard from "./AllVotesCastCard";
import TimesUpCard from "./TimesUpCard";
import { markActiveGameRoute } from "@/lib/active-game-recovery";
import { playSound } from "@/lib/sound-engine";

export default function VoteScreen() {
  const router = useRouter();

  const [session, setSession] = useState<RoundSession | null>(null);
  const [screenState, setScreenState] = useState<VoteScreenState>("pass-phone");
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const advancingRef = useRef(false);
  const allCastSoundPlayedRef = useRef(false);

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

    setSession(existing);
    setScreenState(isVotingComplete(existing) ? "all-cast" : "pass-phone");
    markActiveGameRoute("/voting");
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

  // Fires the drumroll exactly once per round, the moment the last
  // vote lands -- not re-fired on a refresh that recovers straight
  // into "all-cast" from a previous visit.
  useEffect(() => {
    if (screenState === "all-cast" && !allCastSoundPlayedRef.current) {
      allCastSoundPlayedRef.current = true;
      playSound("results-lose");
    }
  }, [screenState]);

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
  }

  function handleSelect(playerId: string) {
    setSelectedTargetId(playerId);
    playSound("ui-tap");
  }

  function handleCastVote() {
    if (!selectedTargetId) return;
    setScreenState("confirm");
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

  function handleVotingTimerExpire() {
    if (!isVotingComplete(activeSession)) {
      setTimeUp(true);
    }
  }

  function handleRevealResults() {
    router.push("/results");
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
              durationSeconds={votingDuration}
              onExpire={handleVotingTimerExpire}
            />
          )}

          {timeUp ? (
            <TimesUpCard
              votesCast={getVotesCastCount(activeSession)}
              totalPlayers={getActiveVotingOrder(activeSession).length}
              onContinue={() => setTimeUp(false)}
            />
          ) : (
            <>
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
                />
              )}

              {screenState === "confirm" &&
                currentVoter &&
                selectedTargetId && (
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
            </>
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
