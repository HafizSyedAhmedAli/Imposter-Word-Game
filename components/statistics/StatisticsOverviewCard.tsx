import { Trophy } from "lucide-react";
import type { GlobalStatistics } from "@/lib/statistics-aggregation";

/**
 * The compact overview at the top of the Statistics screen: Games
 * Played, then Crew/Imposter Wins and Win Rates side by side. Mirrors
 * FinalRoundSummaryCard's card shell (same border/surface/backdrop-blur
 * treatment) and WinnerHero's green/red color convention for crew vs.
 * imposter, so this screen reads as belonging to the same app rather
 * than a new visual language.
 */
export default function StatisticsOverviewCard({
  stats,
}: {
  stats: GlobalStatistics;
}) {
  return (
    <section
      className="animate-iw-fade-up rounded-3xl border border-iw-border bg-iw-surface/40 p-5 backdrop-blur-sm"
      style={{ animationDelay: "0ms" }}
    >
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-iw-gold-500" aria-hidden="true" />
        <p className="font-display text-lg font-bold text-iw-ink-100">
          OVERVIEW
        </p>
      </div>

      <div className="mt-4 flex flex-col items-center gap-1 rounded-2xl border border-iw-border bg-iw-surface-2/50 py-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
          Games Played
        </span>
        <span className="font-display text-4xl font-bold text-iw-ink-100">
          {stats.gamesPlayed}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-iw-online/30 bg-iw-online/10 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
            Crew Wins
          </span>
          <span className="font-display text-2xl font-bold text-iw-online">
            {stats.crewWins}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-iw-red/30 bg-iw-red/10 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
            Imposter Wins
          </span>
          <span className="font-display text-2xl font-bold text-iw-red">
            {stats.imposterWins}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-iw-border bg-iw-surface-2/50 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
            Crew Win Rate
          </span>
          <span className="font-display text-2xl font-bold text-iw-ink-100">
            {stats.crewWinRate}%
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-iw-border bg-iw-surface-2/50 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
            Imposter Win Rate
          </span>
          <span className="font-display text-2xl font-bold text-iw-ink-100">
            {stats.imposterWinRate}%
          </span>
        </div>
      </div>
    </section>
  );
}
