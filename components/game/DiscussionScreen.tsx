// components/game/DiscussionScreen.tsx
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
import { markActiveGameRoute } from "@/lib/active-game-recovery";
import { playSound } from "@/lib/sound-engine";

export default function DiscussionScreen() {
  const router = useRouter();

  // Read the stored round once, synchronously, as the initial state --
  // the redirect checks below key off this same value and never call
  // setSession themselves, so there's no extra render on mount.
  const [session] = useState<RoundSession | null>(() =>
    getStoredRoundSession(),
  );
  const [timerExpired, setTimerExpired] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const playerIndexById = useMemo(() => {
    const map = new Map<string, number>();
    if (session) {
      session.players.forEach((player, index) => map.set(player.id, index));
    }
    return map;
  }, [session]);

  useEffect(() => {
    if (session === null) {
      router.replace("/round");
      return;
    }

    if (session.status === "ready") {
      router.replace("/pass");
      return;
    }

    if (session.status === "finished") {
      router.replace("/");
      return;
    }

    markActiveGameRoute("/game");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    playSound("ui-tap");
    router.push("/voting");
  }

  function handleDiscussionTimerExpire() {
    setTimerExpired(true);
    handleStartVoting();
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
            onExpire={handleDiscussionTimerExpire}
          />

          <DiscussionPlayersCard
            players={players}
            indexById={playerIndexById}
          />

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
