// components/final-results/ImpostersRevealCard.tsx
import { Skull } from "lucide-react";
import PlayerAvatar from "@/components/players/PlayerAvatar";
import type { FinalPlayerResult } from "@/game/final-results-flow";

/**
 * "WHO WERE THE IMPOSTERS?" -- the first screen allowed to reveal every
 * imposter at once. Works identically for 1, 2, or 3 imposters (spec's
 * "MULTIPLE IMPOSTERS") since it just renders whatever
 * `getFinalImposters()` returns, never assumes a fixed count.
 */
export default function ImpostersRevealCard({
  imposters,
}: {
  imposters: FinalPlayerResult[];
}) {
  return (
    <section
      className="animate-iw-fade-up rounded-3xl border border-iw-red/40 bg-gradient-to-b from-iw-red/10 to-iw-surface/70 p-5"
      style={{ animationDelay: "0.2s" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skull className="h-5 w-5 text-iw-red" aria-hidden="true" />
          <p className="font-display text-lg font-bold text-iw-ink-100">
            THE IMPOSTERS
          </p>
        </div>
        <span className="rounded-full border border-iw-red/40 bg-iw-red/10 px-3 py-1 text-xs font-bold text-iw-red">
          {imposters.length} {imposters.length === 1 ? "IMPOSTER" : "IMPOSTERS"}
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {imposters.map((result) => (
          <li
            key={result.player.id}
            className="flex items-center gap-3 rounded-2xl border border-iw-red/20 bg-iw-surface-2/60 px-3 py-2.5"
          >
            <PlayerAvatar index={result.index} />
            <span className="flex-1 font-display text-sm font-semibold text-iw-ink-100">
              🔴 {result.player.name}
            </span>
            {result.eliminated && (
              <span className="text-xs font-semibold text-iw-ink-500">
                Caught
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
