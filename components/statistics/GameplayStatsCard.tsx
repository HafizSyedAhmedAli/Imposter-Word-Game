import { Activity } from "lucide-react";
import type { GlobalStatistics } from "@/lib/statistics-aggregation";

/**
 * "Gameplay" section (spec's STATISTICS SCREEN UX): rounds, votes,
 * imposters, and catches. Deliberately omits Successful/Failed Imposter
 * Guesses -- this codebase has no final-guess mechanic yet (only
 * vote-based elimination, see game/final-results-flow.ts's doc
 * comment), so those two numbers would always read 0/0. A permanently
 * zero stat isn't useful to a player and isn't worth a card (spec's own
 * "do not add meaningless statistics" rule); the data model already
 * reserves the fields (see lib/statistics-aggregation.ts) so a future
 * guess feature can populate them without another migration.
 */
export default function GameplayStatsCard({
  stats,
}: {
  stats: GlobalStatistics;
}) {
  const rows: { label: string; value: string }[] = [
    { label: "Total Rounds", value: String(stats.totalRounds) },
    {
      label: "Avg Rounds / Game",
      value: stats.averageRoundsPerGame.toFixed(1),
    },
    {
      label: "Avg Players / Game",
      value: stats.averagePlayersPerGame.toFixed(1),
    },
    { label: "Total Votes Cast", value: String(stats.totalVotesCast) },
    {
      label: "Imposters Played",
      value: String(stats.totalImpostersPlayed),
    },
    {
      label: "Imposters Caught",
      value: String(stats.totalImpostersCaught),
    },
  ];

  return (
    <section
      className="animate-iw-fade-up rounded-3xl border border-iw-border bg-iw-surface/40 p-5 backdrop-blur-sm"
      style={{ animationDelay: "80ms" }}
    >
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-iw-violet-300" aria-hidden="true" />
        <p className="font-display text-lg font-bold text-iw-ink-100">
          GAMEPLAY
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
              {row.label}
            </dt>
            <dd className="mt-0.5 font-display text-sm font-bold text-iw-ink-100">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
