// lib/achievements/definitions.ts
//
// Temporary bridge -- the achievement definitions now live in
// `entities/achievement` (see entities/README.md). Existing `import { ...
// } from "@/lib/achievements/definitions"` call sites
// (components/achievements/*, tests) keep working unchanged. Repoint each
// to `@/entities/achievement` as it's touched; this file goes away once
// none are left.
export {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORY_LABELS,
  getAchievementById,
} from "@/entities/achievement";
export type {
  AchievementCategory,
  AchievementDefinition,
  AchievementEvaluation,
  AchievementProgress,
} from "@/entities/achievement";