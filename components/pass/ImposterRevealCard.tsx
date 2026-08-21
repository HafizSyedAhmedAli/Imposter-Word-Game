// components/pass/ImposterRevealCard.tsx
"use client";

import { useEffect, useState } from "react";
import { EyeOff } from "lucide-react";

// Matches PlayerRevealCard's CREW_REVEAL_DELAY_MS -- kept as a literal
// here rather than a shared import so this component's props/behavior
// stay fully independent of the crew card (see the no-`word`-prop note
// below). Same 2s hold on both cards so the button's enable timing
// can't itself become a tell for who's the imposter.
const REVEAL_HOLD_MS = 2000;

// IMPORTANT: this component intentionally has no `word` prop. Do not add
// one -- the imposter must never receive the secret word, and omitting
// it from the props entirely (not just the render) is a deliberate
// second layer of protection (see spec section 48).
export default function ImposterRevealCard({
  playerName,
  hint,
  onHide,
}: {
  playerName: string;
  hint: string;
  onHide: () => void;
}) {
  const [canHide, setCanHide] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanHide(true), REVEAL_HOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="animate-iw-fade-in flex flex-col items-center gap-6 text-center"
      aria-live="polite"
    >
      <div className="w-full rounded-3xl border border-iw-red/40 bg-gradient-to-b from-iw-red/10 to-iw-surface/70 p-6 backdrop-blur-sm">
        <p className="font-display text-lg font-bold text-iw-red">
          🔴 YOU&apos;RE THE IMPOSTER
        </p>
        <p className="mt-1 text-sm text-iw-ink-500">{playerName}</p>

        <p className="mt-6 text-sm text-iw-ink-300">
          You don&apos;t know the secret word.
        </p>

        <div className="mt-6 border-t border-iw-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
            Hint
          </p>
          <p className="mt-1 text-base text-iw-ink-300">{hint}</p>
        </div>

        <p className="mt-6 text-sm text-iw-ink-500">
          Listen carefully to everyone else&apos;s clues.
        </p>
      </div>

      <button
        type="button"
        onClick={onHide}
        disabled={!canHide}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-all duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
      >
        <EyeOff className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        HIDE &amp; PASS PHONE
      </button>
    </section>
  );
}
