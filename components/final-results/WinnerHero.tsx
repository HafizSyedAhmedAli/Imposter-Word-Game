// components/final-results/WinnerHero.tsx
import type { FinalOutcome } from "@/game/final-results-flow";

/**
 * The top-of-screen celebration beat (spec's "WINNER HERO" + "WIN
 * REASON"). Purely presentational -- `outcome` and `reason` are always
 * passed in already resolved by game/final-results-flow.ts, never
 * recomputed here (spec: "Do NOT hard-code the reason").
 *
 * Winner status is communicated through text and the emoji glyph, never
 * color alone (spec's ACCESSIBILITY section) -- "CREW WINS!" /
 * "IMPOSTERS WIN!" is the actual heading text, not just a colored badge.
 */
export default function WinnerHero({
  outcome,
  reason,
}: {
  outcome: FinalOutcome;
  reason: string;
}) {
  const isCrewWin = outcome === "crew-win";

  return (
    <section
      className={`animate-iw-fade-up flex flex-col items-center gap-2 rounded-3xl border p-6 text-center ${
        isCrewWin
          ? "border-iw-online/40 bg-gradient-to-b from-iw-online/10 to-iw-surface/70"
          : "border-iw-red/40 bg-gradient-to-b from-iw-red/10 to-iw-surface/70"
      }`}
      aria-live="polite"
    >
      <span
        className="animate-iw-float text-5xl"
        role="img"
        aria-label={isCrewWin ? "Party popper" : "Devil face"}
      >
        {isCrewWin ? "🎉" : "😈"}
      </span>

      <h1
        className={`font-display text-3xl font-bold ${
          isCrewWin ? "text-iw-online" : "text-iw-red"
        }`}
      >
        {isCrewWin ? "CREW WINS!" : "IMPOSTERS WIN!"}
      </h1>

      <p className="text-sm text-iw-ink-300">
        {isCrewWin
          ? "The imposters were discovered."
          : "The imposters fooled the crew."}
      </p>

      <p className="mt-2 rounded-full border border-iw-border bg-iw-surface-2/60 px-4 py-1.5 text-xs font-semibold text-iw-ink-500">
        {reason}
      </p>
    </section>
  );
}