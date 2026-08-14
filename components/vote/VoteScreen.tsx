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

export default function VoteScreen() {
  const router = useRouter();

  // Same deterministic-null-then-hydrate pattern as PassPhoneScreen and
  // DiscussionScreen -- this is a client component but still gets a
  // server render on first load, where `sessionStorage` doesn't exist.
  const [session, setSession] = useState<RoundSession | null>(null);
  const [screenState, setScreenState] = useState<VoteScreenState>("pass-phone");
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const advancingRef = useRef(false); // guards double-taps, same as PassPhoneScreen

  // Runs once, after hydration. Reading the stored session AND deciding
  // whether/where to redirect both happen in this single effect, same
  // reasoning as PassPhoneScreen and DiscussionScreen -- splitting them
  // risks redirecting based on state from before the session was
  // restored.
  useEffect(() => {
    const existing = getStoredRoundSession();

    if (existing === null) {
      // Deep-linked straight to /voting with no prepared round -- send
      // them to build one instead of rendering an empty ballot.
      router.replace("/round");
      return;
    }

    if (existing.status === "ready") {
      // Pass-the-phone (Screen 5) hasn't finished yet -- route back
      // through the real transition rather than starting voting on
      // roles no one has seen.
      router.replace("/pass");
      return;
    }

    if (existing.status === "finished") {
      // Nothing left to vote on, and there's no results screen to
      // return to yet -- go to the safest known destination.
      router.replace("/");
      return;
    }

    // status === "playing": Screen 6 is done and this round's voting
    // may already be partway through (or fully done) from a previous
    // visit. Recover the correct state purely from `existing.votes`
    // (see game/vote-flow.ts) rather than always starting at
    // "pass-phone" -- this is what makes a mid-voting refresh safe
    // (spec sections 60-64).
    setSession(existing);
    setScreenState(isVotingComplete(existing) ? "all-cast" : "pass-phone");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intercept back navigation, same guard as Screen 5/6 -- a
  // hardware/browser back action must go through the leave-round
  // confirmation, never bypass it straight back to discussion.
  useEffect(() => {
    function handlePopState() {
      openLeaveConfirmation();
      window.history.pushState(null, "", window.location.href);
    }
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Tab-visibility protection, same as PassPhoneScreen -- if the tab is
  // hidden mid-selection, drop back to the private hand-off gate rather
  // than leaving a half-made selection visible when it's reopened.
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

  // Stable per-seat avatar index, keyed by player ID -- VoteSelectionCard
  // renders a filtered (self-excluded) list, but avatars must still
  // match each player's actual seat color from the full roster.
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
  }

  function handleCastVote() {
    if (!selectedTargetId) return;
    setScreenState("confirm");
  }

  function handleGoBack() {
    setScreenState("voting");
  }

  function handleConfirmVote() {
    if (advancingRef.current) return; // one submission per tap, never two
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
    // Results is a separate screen/phase -- this only navigates
    // forward, it never computes or mutates round outcome data itself.
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
