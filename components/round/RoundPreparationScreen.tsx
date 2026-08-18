"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import { useGameSetup } from "@/lib/game-setup-context";
import { getImposterCount, isPlayerCountValid } from "@/game/game-rules";
import type { RoundSession } from "@/game/game-types";
import { prepareGameRound, type PreparationStage } from "@/game/game-engine";
import {
  clearStoredRoundSession,
  getStoredRoundSession,
  storeRoundSession,
} from "@/lib/round-session-store";
import RoundPreparationHeader from "./RoundPreparationHeader";
import GameSummaryCard from "./GameSummaryCard";
import PreparationAnimation from "./PreparationAnimation";
import PreparationProgress from "./PreparationProgress";
import PreparationStatus from "./PreparationStatus";
import RoundSourceIndicator from "./RoundSourceIndicator";
import RoundErrorRecovery from "./RoundErrorRecovery";
import { markActiveGameRoute } from "@/lib/active-game-recovery";

type ScreenPhase = "preparing" | "ready" | "no-players" | "error";

const STAGE_META: Record<
  PreparationStage,
  { step: number; onlineStatus: string; offlineStatus: string }
> = {
  word: {
    step: 1,
    onlineStatus: "Creating your secret word...",
    offlineStatus: "Using your offline word collection...",
  },
  hint: {
    step: 2,
    onlineStatus: "Crafting a clever hint...",
    offlineStatus: "Preparing your offline hint...",
  },
  roles: {
    step: 3,
    onlineStatus: "Choosing the imposters...",
    offlineStatus: "Choosing the imposters...",
  },
  finalizing: {
    step: 4,
    onlineStatus: "Securing the round...",
    offlineStatus: "Securing the round...",
  },
};

// Small, deliberate pause per post-fetch stage so the progress meter never
// jumps straight from 25% to 100% -- but short enough that it never reads
// as an artificial delay (see Screen 4 spec, section 48).
const STAGE_PACING_MS = 320;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function RoundPreparationScreen() {
  const router = useRouter();
  const { config, players, isHydrated } = useGameSetup();

  // NOTE: GameSetupProvider *also* has its own sessionStorage recovery
  // now (lib/game-setup-store.ts), covering the case where this whole
  // component tree just remounted from scratch (e.g. a client-side
  // route transition that fell back to a hard navigation while offline
  // -- see that file's doc comment for the full mechanism). That
  // recovery lands one tick AFTER this first render, so `players` here
  // is still `[]` on the very first paint even when a real player list
  // is about to be restored. The recovery effect further below (keyed
  // on `isHydrated`) is what corrects `phase` once that lands -- it
  // must not be removed just because this initializer "looks" correct
  // in isolation.
  const [session, setSession] = useState<RoundSession | null>(null);
  const [phase, setPhase] = useState<ScreenPhase>(() =>
    isPlayerCountValid(config.mode, players.length)
      ? "preparing"
      : "no-players",
  );
  const [stage, setStage] = useState<PreparationStage>("word");
  const [wasOnlineAtStart, setWasOnlineAtStart] = useState(true);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const startedRef = useRef(false);
  const recoveredRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  async function runPreparation() {
    // Explicitly defer to a microtask before touching state. The initial
    // call happens from the mount effect below, where `phase` is already
    // "preparing" via the lazy initializer -- this just ensures every
    // state update here happens from an async callback, not synchronously
    // inside the effect body itself.
    await Promise.resolve();

    setPhase("preparing");
    setStage("word");
    setSession(null);
    setWasOnlineAtStart(
      typeof navigator === "undefined" ? true : navigator.onLine,
    );

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const prepared = await prepareGameRound(config, players, {
        signal: controller.signal,
        onStage: async (nextStage) => {
          setStage(nextStage);
          if (nextStage !== "word") {
            await wait(STAGE_PACING_MS);
          }
        },
      });

      if (controller.signal.aborted) return;

      storeRoundSession(prepared);
      markActiveGameRoute("/round");
      setSession(prepared);
      setPhase("ready");

      await wait(1100);
      if (!controller.signal.aborted) {
        router.push("/pass");
      }
    } catch {
      if (controller.signal.aborted) return;
      setPhase("error");
    }
  }

  useEffect(() => {
    // Guards against React StrictMode's double-invoked effects in dev --
    // a round must only ever be generated once (see Screen 4 spec,
    // section 35).
    if (startedRef.current) return;
    startedRef.current = true;

    // Reading sessionStorage here -- not in a useState initializer --
    // keeps this component's first client render identical to its
    // server render (see the note on session/phase/stage above). A
    // recovered session always takes priority over the player-count
    // check below, matching the original recovery behavior: if a round
    // was already prepared before a refresh, it's reused rather than
    // regenerated, regardless of what the current player list looks
    // like.
    const existing = getStoredRoundSession();
    if (existing) {
      setSession(existing);
      setStage("finalizing");
      setPhase("ready");
      markActiveGameRoute("/round");
      // Nothing to regenerate -- just continue on to Screen 5 (see
      // Screen 4 spec, section 36).
      const timer = setTimeout(() => router.push("/pass"), 900);
      return () => clearTimeout(timer);
    }

    if (phase === "no-players") {
      // Nothing to run, the recovery card handles it.
      return;
    }

    // Kicking off the (cancellable, StrictMode-guarded) round
    // preparation pipeline on mount -- its state updates happen from
    // async callbacks, not synchronously here. See runPreparation().
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runPreparation();
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  return () => {
    abortRef.current?.abort();
  };
}, []);

  // Recovers from a false "no-players" reading. `phase` was decided
  // synchronously above, before GameSetupProvider's own sessionStorage
  // hydration (lib/game-setup-store.ts) had a chance to run -- normally
  // that's moot because `players` really is `[]` on a fresh mount, but
  // after an offline hard-navigation remount it usually isn't: hydration
  // lands a tick later with the real player list. `isHydrated` gates
  // this so it never fires before that recovery has actually resolved
  // one way or the other, and `recoveredRef` (separate from
  // `startedRef`, which the effect above already marked `true`) ensures
  // this can only ever trigger `runPreparation()` once.
  useEffect(() => {
    if (phase !== "no-players") return;
    if (!isHydrated) return;
    if (recoveredRef.current) return;
    if (!isPlayerCountValid(config.mode, players.length)) return;

    recoveredRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runPreparation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isHydrated, config.mode, players.length]);

  function handleBack() {
    if (phase === "preparing") {
      // Preparation is still running -- cancel it outright rather than
      // leaving an AI request running in the background (see Screen 4
      // spec, section 17).
      abortRef.current?.abort();
      router.push("/players");
      return;
    }
    if (phase === "ready") {
      setConfirmingLeave(true);
      return;
    }
    router.push("/players");
  }

  function confirmLeave() {
    clearStoredRoundSession();
    router.push("/players");
  }

  const displayConfig = session?.config ?? config;
  const displayPlayerCount = session?.players.length ?? players.length;
  const displayImposterCount =
    session?.round.imposterCount ??
    getImposterCount(players.length, config.mode);

  const stageMeta = STAGE_META[stage];
  const statusText = wasOnlineAtStart
    ? stageMeta.onlineStatus
    : stageMeta.offlineStatus;

  return (
    <div className="relative flex min-h-dvh w-full justify-center">
      <SpaceBackdrop />

      <div className="flex w-full max-w-[1400px] flex-col px-4 pl-safe pr-safe pt-safe pb-safe sm:px-6 sm:py-8 lg:px-10">
        <RoundPreparationHeader onBack={handleBack} />

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-6 py-6 text-center lg:max-w-3xl">
          <div className="animate-iw-fade-up">
            <h1 className="font-display text-3xl font-bold tracking-tight text-iw-ink-100 sm:text-4xl">
              {phase === "ready" ? "ROUND READY!" : "GETTING READY..."}
            </h1>
            <p className="mt-1 text-sm text-iw-violet-300 sm:text-base">
              {phase === "ready"
                ? "Pass the phone to the first player."
                : "Preparing your secret round"}
            </p>
          </div>

          {(phase === "preparing" || phase === "ready") && (
            <>
              <GameSummaryCard
                config={displayConfig}
                playerCount={displayPlayerCount}
                imposterCount={displayImposterCount}
              />

              <PreparationAnimation ready={phase === "ready"} />

              {phase === "preparing" && (
                <>
                  <PreparationStatus text={statusText} />
                  <PreparationProgress step={stageMeta.step} />
                </>
              )}

              <RoundSourceIndicator
                source={session?.round.contentSource ?? null}
              />
            </>
          )}

          {phase === "no-players" && (
            <RoundErrorRecovery
              title="Let's set up the players first"
              message="We couldn't find a player list for this round. Head back to add your players."
              onBack={() => router.push("/players")}
            />
          )}

          {phase === "error" && (
            <RoundErrorRecovery
              title="Couldn't prepare the round"
              message="Something went wrong getting your round ready. Give it another try, or head back to check your players."
              onRetry={() => void runPreparation()}
              onBack={() => {
                clearStoredRoundSession();
                router.push("/players");
              }}
            />
          )}
        </main>

        {confirmingLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-iw-void/70 px-6 backdrop-blur-sm">
            <div className="animate-iw-fade-up w-full max-w-sm rounded-3xl border border-iw-border bg-iw-surface p-6 text-center">
              <h2 className="font-display text-lg font-bold text-iw-ink-100">
                Leave round setup?
              </h2>
              <p className="mt-2 text-sm text-iw-ink-500">
                Your prepared round will be discarded.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingLeave(false)}
                  className="w-full rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-3 font-display text-sm font-bold text-iw-gold-ink cursor-pointer"
                >
                  STAY HERE
                </button>
                <button
                  type="button"
                  onClick={confirmLeave}
                  className="w-full rounded-2xl border border-iw-border bg-iw-surface-2 px-6 py-3 font-display text-sm font-bold text-iw-ink-100 transition-colors hover:border-iw-border-strong cursor-pointer"
                >
                  LEAVE ROUND SETUP
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
