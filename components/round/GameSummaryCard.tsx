import { Users, Skull, Dices, Gauge } from "lucide-react";
import type { GameConfig } from "@/game/game-types";
import {
  CATEGORIES,
  DIFFICULTIES,
  MAX_PLAYERS,
  MORE_CATEGORIES,
  getModeDisplayName,
} from "@/game/game-rules";

function getCategoryLabel(id: string): string {
  return (
    CATEGORIES.find((c) => c.id === id)?.label ??
    MORE_CATEGORIES.find((c) => c.id === id)?.label ??
    id
  );
}

/**
 * Read-only summary shown throughout preparation. Intentionally mirrors
 * components/players/GameConfigSummary.tsx but adds the player count and
 * the *resolved* imposter count (not a config-time guess) -- this is safe
 * to show because it never reveals which specific players are imposters
 * (see Screen 4 spec, section 22).
 */
export default function GameSummaryCard({
  config,
  playerCount,
  imposterCount,
}: {
  config: GameConfig;
  playerCount: number;
  imposterCount: number;
}) {
  const modeName = getModeDisplayName(config.mode);
  const difficultyInfo = DIFFICULTIES.find((d) => d.id === config.difficulty);
  const categoryLabel = getCategoryLabel(config.category);

  return (
    <section className="animate-iw-fade-up rounded-3xl border border-iw-border bg-iw-surface/40 p-4 backdrop-blur-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-iw-violet-500/15 text-iw-violet-300">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
              Players
            </p>
            <p className="font-display text-lg font-bold text-iw-ink-100">
              {playerCount}{" "}
              <span className="text-sm font-semibold text-iw-ink-500">
                / {MAX_PLAYERS}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-iw-red/15 text-iw-red">
            <Skull className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
              Imposters
            </p>
            <p className="font-display text-lg font-bold text-iw-ink-100">
              {imposterCount}{" "}
              <span className="text-sm font-semibold text-iw-ink-500">
                ({modeName})
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-iw-gold-500/15 text-iw-gold-400">
            <Dices className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
              Category
            </p>
            <p className="font-display text-lg font-bold text-iw-gold-400">
              {categoryLabel}
            </p>
          </div>
        </div>

        {difficultyInfo && (
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-iw-violet-500/15 text-iw-violet-300">
              <Gauge className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
                Difficulty
              </p>
              <p className="font-display text-lg font-bold text-iw-ink-100">
                {difficultyInfo.title[0] +
                  difficultyInfo.title.slice(1).toLowerCase()}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}