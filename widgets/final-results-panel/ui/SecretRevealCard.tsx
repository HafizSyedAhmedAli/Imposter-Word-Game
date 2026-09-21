// components/final-results/SecretRevealCard.tsx
import { Sparkles } from "lucide-react";

/**
 * The "THE SECRET" card -- word + hint, safe to reveal in full because
 * the round is over (spec: "PRIVACY... On Screen 9: reveal secret word,
 * hint"). `word`/`hint` are always passed straight from
 * `session.round`, never hard-coded (spec: "must come from the actual
 * RoundSession").
 */
export default function SecretRevealCard({
  word,
  hint,
}: {
  word: string;
  hint: string;
}) {
  return (
    <section
      className="animate-iw-fade-up rounded-3xl border border-iw-gold-500/40 bg-gradient-to-b from-iw-gold-500/10 to-iw-surface/70 p-6 text-center backdrop-blur-sm"
      style={{ animationDelay: "0.1s" }}
    >
      <div className="flex items-center justify-center gap-2">
        <Sparkles className="h-4 w-4 text-iw-gold-400" aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
          The Secret Word
        </p>
      </div>

      <p className="mt-2 font-display text-4xl font-bold break-words text-iw-gold-400">
        {word}
      </p>

      <div className="mt-5 border-t border-iw-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
          Hint
        </p>
        <p className="mt-1 text-sm text-iw-ink-300">{hint}</p>
      </div>
    </section>
  );
}
