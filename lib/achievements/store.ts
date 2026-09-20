// lib/achievements/store.ts
//
// Temporary bridge -- the achievement orchestration/persistence layer now
// lives in `entities/achievement` (see entities/README.md). Existing
// `import { ... } from "@/lib/achievements/store"` call sites
// (components/achievements/*, components/final-results/FinalResultsScreen.tsx,
// features/reset-game-data, tests) keep working unchanged. Repoint each to
// `@/entities/achievement` as it's touched; this file goes away once none
// are left.
export {
  processAchievementsForCompletedGame,
  getAchievementsSnapshot,
  resetAchievements,
} from "@/entities/achievement";
export type {
  AchievementsSnapshot,
  UnlockedAchievementEvent,
} from "@/entities/achievement";