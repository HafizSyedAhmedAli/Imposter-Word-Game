// components/final-results/PlayerResultsList.tsx
import { Skull, Users } from "lucide-react";
import PlayerAvatar from "@/components/players/PlayerAvatar";
import type { FinalPlayerResult } from "@/game/final-results-flow";

/**
 * "PLAYER RESULTS" -- every player's complete public outcome, in the
 * same stable seat order used everywhere else (`getFinalPlayerResults`
 * never sorts). Role is always shown as text ("Crew" / "Imposter"), not
 * just a colored dot (spec's ACCESSIBILITY + "Do not rely only on
 * red/green colors").
 */
export default function PlayerResultsList({
  results,
}: {
  results: FinalPlayerResult[];
}) {
  return (
    <section
      className="animate-iw-fade-up rounded-3xl border border-iw-border bg-iw-surface/70 p-5"
      style={{ animationDelay: "0.3s" }}
    >
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-iw-violet-300" aria-hidden="true" />
        <p className="font-display text-lg font-bold text-iw-ink-100">
          PLAYER RESULTS
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {results.map((result) => {
          const isImposter = result.role === "imposter";
          return (
            <li
              key={result.player.id}
              className="flex items-center gap-3 rounded-2xl border border-iw-border bg-iw-surface-2/50 px-3 py-2.5"
            >
              <PlayerAvatar index={result.index} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold text-iw-ink-100">
                  {result.player.name}
                </p>
                <p
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    isImposter ? "text-iw-red" : "text-iw-online"
                  }`}
                >
                  {isImposter ? (
                    <Skull className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Users className="h-3 w-3" aria-hidden="true" />
                  )}
                  {isImposter ? "Imposter" : "Crew"}
                </p>
              </div>
              {result.eliminated && (
                <span className="shrink-0 rounded-full border border-iw-border-strong bg-iw-surface px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-iw-ink-500">
                  Eliminated
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
