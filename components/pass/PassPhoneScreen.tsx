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

export default function PassPhoneScreen() {
  const router = useRouter();

  // Deterministic initial state -- must NOT depend on sessionStorage,
  // since this component is server-rendered on the initial full page
  // load (see "use client" in Next.js App Router) and `window` doesn't
  // exist there. If these read the browser's stored session directly
  // (e.g. via a lazy useState initializer), the server render and the
  // client's first hydration render diverge whenever a session is
  // already stored -- server renders nothing (`session === null` below
  // returns null), client renders the full pass-flow UI -- which is a
  // hydration mismatch. The real value is read once, client-only, in
  // the effect below instead.
  const [session, setSession] = useState<RoundSession | null>(null);
  const [passState, setPassState] = useState<PassState>("pass-phone");
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const advancingRef = useRef(false); // guards double-taps on Hide & Pass

  // Runs once, after hydration completes (effects never run during SSR,
  // so `sessionStorage` is always safe here). Reading the stored session
  // AND deciding whether/where to redirect both happen in this single
  // effect -- splitting them (e.g. a separate effect checking
  // `session === null`) would check state from before this effect had a
  // chance to restore it (spec sections 23, 66).
  //
  // Every `RoundStatus` is handled explicitly and exhaustively here --
  // this screen is ONLY the right place to render for "ready" sessions.
  // Anything else routes (or redirects) to that status's real screen,
  // rather than falling into a generic "all-ready" fallback that could
  // let a stale/finished session reach beginDiscussion() again.
  useEffect(() => {
    const existing = getStoredRoundSession();

    if (existing === null) {
      // No prepared round to consume (e.g. someone deep-linked to /pass)
      // -- send them back to build one instead of rendering nothing
      // forever.
      router.replace("/round");
      return;
    }

    switch (existing.status) {
      case "preparing":
        // The round hasn't finished being generated yet -- there's
        // nothing to reveal or pass around. Send them back to finish
        // that step instead of rendering an invalid pass flow.
        router.replace("/round");
        return;

      case "ready":
        // The only status this screen is actually for: reveal-and-pass
        // hasn't started (or is still in progress).
        setSession(existing);
        setPassState("pass-phone");
        return;

      case "playing":
        // Discussion has already begun -- beginDiscussion() already ran
        // for this session, so their real current screen is Discussion,
        // not this one. Routing there (rather than rendering
        // "all-ready" here) means there's no START DISCUSSION button
        // left on this screen that could call beginDiscussion() a
        // second time on an already-playing round.
        router.replace("/game");
        return;

      case "finished":
        // Nothing left to reveal, pass, or discuss, and there's no
        // results screen to return to yet -- go to the safest known
        // destination. Critically, this must NOT fall through to
        // "all-ready": that screen's START DISCUSSION button calls
        // beginDiscussion(), which would flip a finished round straight
        // back to "playing".
        router.replace("/");
        return;
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
      openLeaveConfirmation();
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

  // Opens the leave-round confirmation. If a secret is currently on
  // screen ("revealed"), it's hidden FIRST -- otherwise the reveal card
  // stays mounted behind the (translucent) dialog and the word or hint
  // can still be read by someone else. Cancelling the dialog leaves
  // `passState` at "private-reveal", so the player has to explicitly
  // tap reveal again rather than the secret silently reappearing.
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
