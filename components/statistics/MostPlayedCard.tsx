import { Flame } from "lucide-react";
import type { GlobalStatistics } from "@/lib/statistics-aggregation";
import {
  DIFFICULTIES,
  getGameConfigCategoryLabel,
  getModeDisplayName,
} from "@/game/game-rules";
import type { Category, Difficulty, GameMode } from "@/game/game-types";

function categoryLabel(category: string | null): string {
  if (!category) return "—";
  // Reuses the exact label function the rest of the app already shows
  // a round's category with (Players/Round Preparation screens) --
  // including its "custom" pseudo-category special-case (spec section
  // 23: Custom Words should be able to show up as a played category).
  return getGameConfigCategoryLabel({ category: category as Category });
}

function difficultyLabel(difficulty: string | null): string {
  if (!difficulty) return "—";
  return (
    DIFFICULTIES.find((d) => d.id === (difficulty as Difficulty))?.title ??
    difficulty
  );
}

function modeLabel(mode: string | null): string {
  if (!mode) return "—";
  return getModeDisplayName(mode as GameMode);
}

/**
 * "Most Played" section: which category, difficulty, and mode this
 * player reaches for most often. `null` fields (no games yet) render as
 * an em dash rather than a fabricated default -- this card is only ever
 * shown once at least one game exists (see StatisticsScreen.tsx's empty
 * state), but stays defensive regardless.
 */
export default function MostPlayedCard({ stats }: { stats: GlobalStatistics }) {
  const rows: { label: string; value: string }[] = [
    { label: "Category", value: categoryLabel(stats.mostPlayedCategory) },
    { label: "Difficulty", value: difficultyLabel(stats.mostPlayedDifficulty) },
    { label: "Game Mode", value: modeLabel(stats.mostPlayedMode) },
  ];

  return (
    <section
      className="animate-iw-fade-up rounded-3xl border border-iw-border bg-iw-surface/40 p-5 backdrop-blur-sm"
      style={{ animationDelay: "160ms" }}
    >
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-iw-gold-500" aria-hidden="true" />
        <p className="font-display text-lg font-bold text-iw-ink-100">
          MOST PLAYED
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col items-center gap-0.5 rounded-2xl border border-iw-border bg-iw-surface-2/50 py-3 text-center"
          >
            <dt className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
              {row.label}
            </dt>
            <dd className="truncate px-1 font-display text-sm font-bold text-iw-ink-100">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
