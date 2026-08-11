import { Skull, Dices, Gauge } from "lucide-react";
import type { GameConfig } from "@/game/game-types";
import {
  CATEGORIES,
  DIFFICULTIES,
  MORE_CATEGORIES,
  getImposterCount,
  getModeDisplayName,
} from "@/game/game-rules";

function getCategoryLabel(id: string): string {
  return (
    CATEGORIES.find((c) => c.id === id)?.label ??
    MORE_CATEGORIES.find((c) => c.id === id)?.label ??
    id
  );
}

export default function GameConfigSummary({ config }: { config: GameConfig }) {
  const modeName = getModeDisplayName(config.mode);
  const difficultyInfo = DIFFICULTIES.find((d) => d.id === config.difficulty);
  const categoryLabel = getCategoryLabel(config.category);

  // Random mode doesn't reveal an imposter count until the game engine
  // resolves it against the final player count (see game-rules.ts).
  const imposterLabel =
    config.mode === "random"
      ? "Balanced"
      : String(getImposterCount(0, config.mode));

  return (
    <section className="animate-iw-fade-up rounded-3xl border border-iw-border bg-iw-surface/40 p-4 backdrop-blur-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-iw-red/15 text-iw-red">
            <Skull className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
              Imposters
            </p>
            <p className="font-display text-lg font-bold text-iw-ink-100">
              {imposterLabel}{" "}
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
