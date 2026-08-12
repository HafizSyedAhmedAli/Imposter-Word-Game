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

function readExistingSession(): RoundSession | null {
  if (typeof window === "undefined") return null;
  return getStoredRoundSession();
}

export default function PassPhoneScreen() {
  const router = useRouter();

  const [session, setSession] = useState<RoundSession | null>(
    readExistingSession,
  );

  // Safe default is always "pass-phone" -- a refresh must never resume
  // straight into a revealed secret (spec sections 23, 66). The one
  // exception is a session that already moved past "ready" (e.g. this
  // screen is revisited after discussion started) -- in that case skip
  // straight to "all-ready" rather than re-running anyone's turn. Derived
  // once from the recovered session via a lazy initializer so mounting
  // never needs a setState call from inside an effect.
  const [passState, setPassState] = useState<PassState>(() => {
    const existing = readExistingSession();
    return existing && existing.status !== "ready" ? "all-ready" : "pass-phone";
  });
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const advancingRef = useRef(false); // guards double-taps on Hide & Pass

  // No prepared round to consume (e.g. someone deep-linked to /pass) --
  // send them back to build one instead of rendering nothing forever.
  // A pure navigation side-effect, not a state update, so it's safe to
  // run directly in the effect body.
  useEffect(() => {
    if (session === null) {
      router.replace("/round");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tab-visibility protection: if the tab is hidden mid-reveal, clear the
  // rendered secret on return without touching the underlying session
  // (spec section 67).
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

  // Intercept back navigation so it can never silently expose a previous
  // player's secret -- route it through the same leave-round
  // confirmation as the header button instead (spec section 22, 65).
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

  const currentPlayer = getCurrentPlayer(session);
  const currentRole = getCurrentPlayerRole(session);

  // Malformed session (shouldn't happen if Screen 4 built it correctly) --
  // fail safe rather than rendering broken/partial secret UI.
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

  // `session` is validated non-null above, but TS can't carry that
  // narrowing into closures defined below (the state setter could put it
  // back to null by the time they run) -- capture it in a local const so
  // the handlers below are typed against `RoundSession`, not `| null`.
  const activeSession = session;

  function handleReady() {
    setPassState("private-reveal");
  }

  function handleReveal() {
    setPassState("revealed");
  }

  function handleHideAndPass() {
    if (advancingRef.current) return; // one advance per tap, never two
    advancingRef.current = true;

    // Unmount the secret immediately, don't just cover it (spec section 21).
    setPassState("pass-phone");

    if (isFinalPlayer(activeSession)) {
      setPassState("all-ready");
    } else {
      const next = advanceToNextPlayer(activeSession);
      storeRoundSession(next);
      setSession(next);
    }

    // Release the guard on the next tick, once React has committed the
    // state change that actually prevents a duplicate advance.
    setTimeout(() => {
      advancingRef.current = false;
    }, 0);
  }

  function handleStartDiscussion() {
    const next = beginDiscussion(activeSession);
    storeRoundSession(next);
    router.push("/game");
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
