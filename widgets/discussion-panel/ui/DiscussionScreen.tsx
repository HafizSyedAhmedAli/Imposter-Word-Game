// widgets/discussion-panel/ui/DiscussionScreen.tsx
"use client";

/**
 * Moved from `components/game/DiscussionScreen.tsx` as the
 * `widgets/discussion-panel` slice (FSD migration step 7), along with
 * its five supporting cards (`DiscussionControls`, `DiscussionPlayersCard`,
 * `DiscussionStatusCard`, `DiscussionTimer`, `DiscussionTipsCard`) --
 * unlike `vote-panel`/`pass-phone-panel`, none of these had already
 * been claimed by a `features/*` slice, so the whole screen moved as
 * one unit. Unchanged apart from import-path fixes (this file's five
 * `./`-relative imports needed no change since all six files moved
 * together; only `RoundPreparationHeader` -- already
 * `@/shared/ui/RoundPreparationHeader` from the previous widget move --
 * was checked and needed no further fix). None of the five cards are
 * reused elsewhere (checked before moving), so none went to
 * `shared/ui/` the way `PlayerAvatar`/`RoundPreparationHeader` did. See
 * `../../README.md`. `app/game/page.tsx` repointed to
 * `@/widgets/discussion-panel`.
 */
import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import LeaveRoundDialog from "@/shared/ui/LeaveRoundDialog";
import RoundPreparationHeader from "@/shared/ui/RoundPreparationHeader";
import {
  getDiscussionDuration,
  getSpeakingOrder,
} from "@/features/play-round";
import type { RoundSession } from "@/game/game-types";
import {
  clearStoredRoundSession,
  getStoredRoundSession,
  markActiveGameRoute,
} from "@/entities/round";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import DiscussionControls from "./DiscussionControls";
import DiscussionPlayersCard from "./DiscussionPlayersCard";
import DiscussionStatusCard from "./DiscussionStatusCard";
import DiscussionTimer from "./DiscussionTimer";
import DiscussionTipsCard from "./DiscussionTipsCard";
import { analytics } from "@/lib/analytics";
import { playSound } from "@/shared/lib/sound-engine";
import { useLeaveRoundBackGuard } from "@/lib/use-leave-round-back-guard";

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

  useLeaveRoundBackGuard(() => setConfirmingLeave(true));

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
    analytics.gameAbandoned({
      phase: "discussion",
      playerCount: session!.players.length,
      mode: session!.config.mode,
    });
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
