import { Trophy } from "lucide-react";

/**
 * Win conditions are pulled directly from getRoundOutcome() in
 * game/results-flow.ts: Crew wins once every Imposter is eliminated;
 * Imposters win once surviving Imposters equal or outnumber surviving
 * Crew. Not built on SectionCard -- this needs the same two-tone
 * card-pair treatment as GoalCards.tsx.
 */
export default function WinConditionsSection() {
  return (
    <section
      className="animate-iw-fade-up"
      style={{ animationDelay: "460ms" }}
      aria-label="How to win"
    >
      <div className="flex items-center gap-3 px-1">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-iw-surface-2/60 text-iw-gold-400"
          aria-hidden="true"
        >
          <Trophy className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <h2 className="font-display text-lg font-semibold tracking-wide text-iw-ink-100 sm:text-xl">
          How to Win
        </h2>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-iw-online/40 bg-gradient-to-b from-iw-online/10 to-iw-surface/70 p-5">
          <p className="font-display text-base font-bold text-iw-online">
            🟢 Crew Wins
          </p>
          <p className="mt-1.5 text-sm text-iw-ink-300">
            Every Imposter has been eliminated.
          </p>
        </div>

        <div className="rounded-3xl border border-iw-red/40 bg-gradient-to-b from-iw-red/10 to-iw-surface/70 p-5">
          <p className="font-display text-base font-bold text-iw-red">
            🔴 Imposters Win
          </p>
          <p className="mt-1.5 text-sm text-iw-ink-300">
            The surviving Imposters equal or outnumber the surviving Crew.
          </p>
        </div>
      </div>
    </section>
  );
}
