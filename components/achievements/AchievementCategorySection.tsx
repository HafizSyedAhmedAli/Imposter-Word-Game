import type { AchievementUnlockRecord } from "@/lib/db";
import {
  ACHIEVEMENT_CATEGORY_LABELS,
  type AchievementCategory,
} from "@/lib/achievements/definitions";
import type { AchievementState } from "@/lib/achievements/engine";
import AchievementCard from "./AchievementCard";

/**
 * One category's grouped list (spec section 9: "Getting Started",
 * "Crew", "Imposter", "Special" -- a simple grouped list, since this
 * screen has no existing tab/filter pattern to reuse). Mirrors
 * StatisticsOverviewCard's card shell so this screen reads as
 * belonging to the same app.
 */
export default function AchievementCategorySection({
  category,
  states,
  unlocksById,
  normalizedName,
  animationDelay,
}: {
  category: AchievementCategory;
  states: AchievementState[];
  unlocksById: Map<string, AchievementUnlockRecord>;
  normalizedName: string;
  animationDelay: string;
}) {
  if (states.length === 0) return null;

  return (
    <section
      className="animate-iw-fade-up rounded-3xl border border-iw-border bg-iw-surface/40 p-5 backdrop-blur-sm"
      style={{ animationDelay }}
    >
      <p className="font-display text-lg font-bold text-iw-ink-100">
        {ACHIEVEMENT_CATEGORY_LABELS[category]}
      </p>

      <ul className="mt-4 flex flex-col gap-2.5">
        {states.map((state) => (
          <AchievementCard
            key={state.definition.id}
            state={state}
            unlockedAt={
              unlocksById.get(`${normalizedName}::${state.definition.id}`)
                ?.unlockedAt
            }
          />
        ))}
      </ul>
    </section>
  );
}
