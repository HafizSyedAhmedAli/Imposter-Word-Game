import { Search, Drama } from "lucide-react";

/**
 * Colored side-by-side (stacked on mobile) goal cards. Uses the same
 * green/red role colors as PlayerRevealCard.tsx and ImposterRevealCard.tsx
 * so "Crew" and "Imposter" read consistently everywhere in the app.
 * Deliberately not built on SectionCard -- this needs its own two-tone
 * layout, not a single titled card.
 */
export default function GoalCards() {
  return (
    <section
      className="animate-iw-fade-up"
      style={{ animationDelay: "60ms" }}
      aria-label="The goal"
    >
      <h2 className="px-1 font-display text-lg font-semibold tracking-wide text-iw-ink-100 sm:text-xl">
        The Goal
      </h2>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-iw-online/40 bg-gradient-to-b from-iw-online/10 to-iw-surface/70 p-5 backdrop-blur-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-iw-online/15 text-iw-online">
            <Search className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </div>
          <p className="mt-3 font-display text-lg font-bold text-iw-online">
            🟢 Crew: Find the Imposters
          </p>
          <p className="mt-1.5 text-sm text-iw-ink-300">
            Work together to identify and eliminate every Imposter before they
            take control of the game.
          </p>
        </div>

        <div className="rounded-3xl border border-iw-red/40 bg-gradient-to-b from-iw-red/10 to-iw-surface/70 p-5 backdrop-blur-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-iw-red/15 text-iw-red">
            <Drama className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </div>
          <p className="mt-3 font-display text-lg font-bold text-iw-red">
            🔴 Imposter: Blend In
          </p>
          <p className="mt-1.5 text-sm text-iw-ink-300">
            Use your hint and the discussion to figure out the secret word while
            convincing everyone that you&apos;re Crew.
          </p>
        </div>
      </div>
    </section>
  );
}
