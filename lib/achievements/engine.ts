// lib/achievements/engine.ts
//
// Temporary bridge -- the achievement evaluation engine now lives in
// `entities/achievement` (see entities/README.md). Existing `import { ...
// } from "@/lib/achievements/engine"` call sites
// (components/achievements/*, tests) keep working unchanged. Repoint each
// to `@/entities/achievement` as it's touched; this file goes away once
// none are left.
export {
  buildAchievementPlayerContexts,
  evaluateAchievementsForPlayer,
} from "@/entities/achievement";
export type {
  AchievementPlayerContext,
  AchievementState,
} from "@/entities/achievement";