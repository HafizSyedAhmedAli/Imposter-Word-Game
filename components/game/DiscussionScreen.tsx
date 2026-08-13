"use client";

import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import LeaveRoundDialog from "@/components/pass/LeaveRoundDialog";
import RoundPreparationHeader from "@/components/round/RoundPreparationHeader";
import {
  getDiscussionDuration,
  getSpeakingOrder,
} from "@/game/discussion-flow";
import type { RoundSession } from "@/game/game-types";
import {
  clearStoredRoundSession,
  getStoredRoundSession,
} from "@/lib/round-session-store";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import DiscussionControls from "./DiscussionControls";
import DiscussionPlayersCard from "./DiscussionPlayersCard";
import DiscussionStatusCard from "./DiscussionStatusCard";
import DiscussionTimer from "./DiscussionTimer";
import DiscussionTipsCard from "./DiscussionTipsCard";

export default function DiscussionScreen() {
  const router = useRouter();

  // Same deterministic-null-then-hydrate pattern as PassPhoneScreen --
  // this is a client component but still gets a server render on the
  // initial load, where `sessionStorage` doesn't exist. Reading the
  // real value in a lazy useState initializer would make the server
  // render (nothing) and the client's first hydration render (the full
  // discussion UI) diverge -- so it's read once, client-only, below.
  const [session, setSession] = useState<RoundSession | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  // Runs once, after hydration. Reading the stored session AND deciding
  // whether/where to redirect both happen in this single effect, same
  // as PassPhoneScreen -- splitting them risks redirecting based on
  // state from before the session was restored.

  // same pattern as VoteScreen's playerIndexById
  const playerIndexById = useMemo(() => {
    const map = new Map<string, number>();
    if (session) {
      session.players.forEach((player, index) => map.set(player.id, index));
    }
    return map;
  }, [session]);

  useEffect(() => {
    const existing = getStoredRoundSession();

    if (existing === null) {
      // Deep-linked straight to /game with no prepared round -- send
      // them to build one instead of rendering an empty discussion.
      router.replace("/round");
      return;
    }

    if (existing.status === "ready") {
      // Pass-the-phone hasn't actually finished yet (stale tab, direct
      // URL, etc). Only beginDiscussion() -- triggered from the "All
      // Players Ready" screen -- is allowed to move status to
      // "playing", so route back through that real transition instead
      // of silently starting discussion here.
      router.replace("/pass");
      return;
    }

    if (existing.status === "finished") {
      // Nothing left to discuss, and there's no results screen to
      // return to yet -- go to the safest known destination rather
      // than restarting or replaying this round.
      router.replace("/");
      return;
    }

    // status === "playing": continue the discussion already in
    // progress. beginDiscussion() is never called from here, and the
    // phone stays put -- there's no per-player state to restore.
    setSession(existing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same back-navigation guard as Screen 5 -- a hardware/browser back
  // action must go through the leave-round confirmation, never bypass
  // it straight back to the pass-phone flow.
  useEffect(() => {
    function handlePopState() {
      setConfirmingLeave(true);
      window.history.pushState(null, "", window.location.href);
    }
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (!session) return null;

  const players = getSpeakingOrder(session);
  const discussionDuration = getDiscussionDuration(session);

  function handleStartVoting() {
    // Voting is a separate screen/phase (see spec, "Discussion
    // Controls") -- this only navigates forward, it never implements
    // voting logic or mutates round/word/hint/roles itself.
    router.push("/voting");
  }

  function handleLeaveConfirmed() {
    clearStoredRoundSession();
    router.push("/players");
  }

  return (
    <div className="relative flex min-h-dvh w-full justify-center">
      <SpaceBackdrop />

      <div className="flex w-full max-w-[1400px] flex-col px-4 pl-safe pr-safe pt-safe pb-safe sm:px-6 sm:py-8">
        <RoundPreparationHeader onBack={() => setConfirmingLeave(true)} />

        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 py-6">
          <DiscussionStatusCard />

          <DiscussionTimer
            durationSeconds={discussionDuration}
            onExpire={() => setTimerExpired(true)}
          />

          <DiscussionPlayersCard players={players} indexById={playerIndexById} />

          <DiscussionTipsCard />

          <DiscussionControls
            expired={timerExpired}
            onStartVoting={handleStartVoting}
          />
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
