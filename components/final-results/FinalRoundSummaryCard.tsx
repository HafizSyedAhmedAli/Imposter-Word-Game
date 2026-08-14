// components/final-results/FinalRoundSummaryCard.tsx
import { ClipboardList } from "lucide-react";
import type { RoundSummary } from "@/game/final-results-flow";

/**
 * "ROUND SUMMARY" -- the compact config recap at the bottom of Screen 9.
 * Named `FinalRoundSummaryCard` (not `RoundSummaryCard`) to avoid
 * colliding with components/round/GameSummaryCard.tsx, which this is
 * deliberately NOT reusing: that card shows category/players/imposters/
 * difficulty but has no dedicated "Mode" row, and the spec calls out
 * Mode as its own line item here. Values always come straight from
 * `getRoundSummary()`, never re-derived (spec: "must use the actual
 * round configuration").
 */
export default function FinalRoundSummaryCard({
  summary,
}: {
  summary: RoundSummary;
}) {
  const rows: { label: string; value: string }[] = [
    { label: "Category", value: summary.category },
    { label: "Difficulty", value: summary.difficulty },
    { label: "Mode", value: summary.mode },
    { label: "Players", value: String(summary.playerCount) },
    { label: "Imposters", value: String(summary.imposterCount) },
  ];

  return (
    <section
      className="animate-iw-fade-up rounded-3xl border border-iw-border bg-iw-surface/40 p-5 backdrop-blur-sm"
      style={{ animationDelay: "0.4s" }}
    >
      <div className="flex items-center gap-2">
        <ClipboardList
          className="h-5 w-5 text-iw-violet-300"
          aria-hidden="true"
        />
        <p className="font-display text-lg font-bold text-iw-ink-100">
          ROUND SUMMARY
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
