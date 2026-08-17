// components/pass/PlayerRevealCard.tsx
"use client";

import { useEffect, useState } from "react";
import { EyeOff } from "lucide-react";

// Total time from mount until the Crew word is fully revealed. Crew-only
// -- the Imposter reveal has no equivalent delay and is untouched by
// this constant.
const CREW_REVEAL_DELAY_MS = 2000;

// How long the unblur/unmask transition itself takes. Kept shorter than
// CREW_REVEAL_DELAY_MS and fired late enough that it finishes exactly
// when CREW_REVEAL_DELAY_MS elapses, so the word sits masked, then
// resolves smoothly into focus right at the 2-second mark, instead of
// holding still and then snapping into view.
const CREW_REVEAL_TRANSITION_MS = 550;

// IMPORTANT: this component intentionally has no `hint` prop. Crew/
// Players never see the AI-generated hint under the new role-info rule
// -- they see the word and must invent their own clue from it. Omitting
// the prop entirely (not just the render) keeps that guarantee even if
// a future edit forgets to check the rule.
export default function PlayerRevealCard({
  playerName,
  word,
  onHide,
}: {
  playerName: string;
  word: string;
  onHide: () => void;
}) {
  // Crew-only reveal delay. Local and isolated to this component -- it
  // does not touch PassPhoneScreen's PassState, session/round logic, or
  // the Imposter reveal card, which has no equivalent state at all.
  // Starts false on every render (including the very first) so the real
  // word is never present in the initial/SSR markup -- there is nothing
  // to flash.
  const [wordVisible, setWordVisible] = useState(false);

  useEffect(() => {
    // This effect re-runs on every mount. PassPhoneScreen only renders
    // this card while passState === "revealed" and unmounts it for
    // every other state (Hide & Pass, tab-hidden fallback, etc.), so a
    // fresh reveal -- even for the same player re-revealing -- always
    // restarts this 2-second delay rather than reusing stale state.
    //
    // The transition is triggered CREW_REVEAL_TRANSITION_MS early so its
    // animation finishes right as CREW_REVEAL_DELAY_MS elapses, rather
    // than holding the mask still for the full delay and then snapping
    // to clear.
    const timer = setTimeout(() => {
      setWordVisible(true);
    }, CREW_REVEAL_DELAY_MS - CREW_REVEAL_TRANSITION_MS);

    // Cleanup clears the pending timer on unmount, which also prevents
    // any state update from firing after unmount (e.g. the player
    // backgrounds the tab or taps Hide & Pass before the delay elapses).
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="animate-iw-fade-in flex flex-col items-center gap-6 text-center"
      aria-live="polite"
    >
      <div className="w-full rounded-3xl border border-iw-online/40 bg-gradient-to-b from-iw-online/10 to-iw-surface/70 p-6 backdrop-blur-sm">
        <p className="font-display text-lg font-bold text-iw-online">
          🟢 YOU&apos;RE A PLAYER
        </p>
        <p className="mt-1 text-sm text-iw-ink-500">{playerName}</p>

        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
          Your secret word
        </p>

        {/*
          Single element, always the real word -- no placeholder swap, so
          there's no layout jump between a differently-sized mask and the
          final text (that swap was the "weird" part). Instead the word
          itself sits blurred/scaled/dim and smoothly pulls into focus.

          Not a flash risk: `wordVisible` starts false on every render
          including the first/SSR pass, so the masked style is present
          from the very first paint -- there's no frame where the word
          is legible before the transition resolves it.

          `aria-hidden` is tied to the same state, so screen readers get
          nothing until the word is actually revealed, independent of
          the visual blur.
        */}
        <p
          className="mt-1 origin-center transform-gpu select-none font-display text-5xl font-bold text-iw-ink-100 break-words transition-all ease-out will-change-[filter,transform,opacity]"
          style={{
            transitionDuration: `${CREW_REVEAL_TRANSITION_MS}ms`,
            filter: wordVisible ? "blur(0px)" : "blur(14px)",
            transform: wordVisible ? "scale(1)" : "scale(0.9)",
            opacity: wordVisible ? 1 : 0.35,
          }}
          aria-hidden={!wordVisible}
        >
          {word}
        </p>

        <p className="mt-6 border-t border-iw-border pt-4 text-sm text-iw-ink-300">
          Give a clue without saying the word directly.
        </p>
      </div>

      <button
        type="button"
        onClick={onHide}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
      >
        <EyeOff className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        HIDE &amp; PASS PHONE
      </button>
    </section>
  );
}
