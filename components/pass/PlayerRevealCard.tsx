// components/pass/PlayerRevealCard.tsx
"use client";

import { useEffect, useState } from "react";
import { EyeOff } from "lucide-react";

const CREW_REVEAL_DELAY_MS = 2000;
const CREW_REVEAL_TRANSITION_MS = 550;

export default function PlayerRevealCard({
  playerName,
  word,
  onHide,
}: {
  playerName: string;
  word: string;
  onHide: () => void;
}) {
  const [wordVisible, setWordVisible] = useState(false);

  useEffect(() => {
    // NOTE: deliberately no sound here. PassPhoneScreen's handleReveal()
    // already plays "reveal-player" once, for every role, the moment
    // the card first appears. Playing a second chime specifically when
    // the word unblurs would mean crew members hear two sounds and the
    // imposter (who has no word to reveal) hears only one -- an audible
    // tell of who the imposter is to anyone within earshot of the
    // phone. Keep this identical across roles.
    const timer = setTimeout(() => {
      setWordVisible(true);
    }, CREW_REVEAL_DELAY_MS - CREW_REVEAL_TRANSITION_MS);

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
        disabled={!wordVisible}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-all duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer  disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
      >
        <EyeOff className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        HIDE &amp; PASS PHONE
      </button>
    </section>
  );
}
