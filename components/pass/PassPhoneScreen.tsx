// components/pass/PassPhoneScreen.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import RoundPreparationHeader from "@/components/round/RoundPreparationHeader";
import {
  clearStoredRoundSession,
  getStoredRoundSession,
  storeRoundSession,
} from "@/lib/round-session-store";
import type { RoundSession } from "@/game/game-types";
import {
  advanceToNextPlayer,
  beginDiscussion,
  getCurrentPlayer,
  getCurrentPlayerRole,
  isFinalPlayer,
  type PassState,
} from "@/game/pass-flow";
import PassPromptCard from "./PassPromptCard";
import PrivateRevealPrompt from "./PrivateRevealPrompt";
import PlayerRevealCard from "./PlayerRevealCard";
import ImposterRevealCard from "./ImposterRevealCard";
import AllPlayersReadyCard from "./AllPlayersReadyCard";
import LeaveRoundDialog from "./LeaveRoundDialog";
import { markActiveGameRoute } from "@/lib/active-game-recovery";
import { playSound } from "@/lib/sound-engine";
import { useLeaveRoundBackGuard } from "@/lib/use-leave-round-back-guard";

export default function PassPhoneScreen() {
  const router = useRouter();

  // Read the stored round once, synchronously, as the initial state --
  // the switch below keys off this same value and only calls
  // setSession later on, from real user actions (handleHideAndPass),
  // never on mount.
  const [session, setSession] = useState<RoundSession | null>(() => {
    const existing = getStoredRoundSession();
    return existing?.status === "ready" ? existing : null;
  });
  const [passState, setPassState] = useState<PassState>("pass-phone");
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const advancingRef = useRef(false);

  useEffect(() => {
    const existing = getStoredRoundSession();

    if (existing === null) {
      router.replace("/round");
      return;
    }

    switch (existing.status) {
      case "preparing":
        router.replace("/round");
        return;

      case "ready":
        markActiveGameRoute("/pass");
        return;

      case "playing":
        router.replace("/game");
        return;

      case "finished":
        router.replace("/");
        return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "hidden" && passState === "revealed") {
        setPassState("private-reveal");
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [passState]);

  useLeaveRoundBackGuard(openLeaveConfirmation);

  if (!session) return null;

  const currentPlayer = getCurrentPlayer(session);
  const currentRole = getCurrentPlayerRole(session);

  if (!currentPlayer || !currentRole) {
    return (
      <div className="relative flex min-h-dvh w-full justify-center">
        <SpaceBackdrop />
        <div className="flex w-full max-w-[1400px] flex-col px-4 pl-safe pr-safe pt-safe pb-safe sm:px-6 sm:py-8">
          <RoundPreparationHeader onBack={() => router.push("/round")} />
          <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
            <p className="font-display text-lg font-bold text-iw-ink-100">
              Something went wrong with this round.
            </p>
            <p className="text-sm text-iw-ink-500">
              Head back and prepare the round again.
            </p>
          </main>
        </div>
      </div>
    );
  }

  const activeSession = session;

  function handleReady() {
    setPassState("private-reveal");
    playSound("ui-tap");
  }

  function handleReveal() {
    setPassState("revealed");
    // The role-reveal moment itself -- the single biggest emotional
    // beat in the round, so it gets a distinct sting per role. The
    // Crew word's own reveal (the ~2s unblur inside PlayerRevealCard)
    // has its own separate sound, fired from that component.
    playSound("reveal-player");
  }

  function handleHideAndPass() {
    if (advancingRef.current) return;
    advancingRef.current = true;

    setPassState("pass-phone");

    if (isFinalPlayer(activeSession)) {
      setPassState("all-ready");
    } else {
      const next = advanceToNextPlayer(activeSession);
      storeRoundSession(next);
      setSession(next);
      playSound("transition-pass");
    }

    setTimeout(() => {
      advancingRef.current = false;
    }, 0);
  }

  function handleStartDiscussion() {
    const next = beginDiscussion(activeSession);
    storeRoundSession(next);
    playSound("phase-discussion");
    router.push("/game");
  }

  function openLeaveConfirmation() {
    setPassState((current) =>
      current === "revealed" ? "private-reveal" : current,
    );
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
          {passState === "pass-phone" && (
            <PassPromptCard
              currentPlayer={currentPlayer}
              currentPlayerIndex={session.currentPlayerIndex}
              players={session.players}
              onReady={handleReady}
            />
          )}

          {passState === "private-reveal" && (
            <PrivateRevealPrompt
              playerName={currentPlayer.name}
              onReveal={handleReveal}
            />
          )}

          {passState === "revealed" && currentRole.role === "player" && (
            <PlayerRevealCard
              playerName={currentPlayer.name}
              word={session.round.word}
              onHide={handleHideAndPass}
            />
          )}

          {passState === "revealed" && currentRole.role === "imposter" && (
            <ImposterRevealCard
              playerName={currentPlayer.name}
              hint={session.round.hint}
              onHide={handleHideAndPass}
            />
          )}

          {passState === "all-ready" && (
            <AllPlayersReadyCard onStartDiscussion={handleStartDiscussion} />
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
