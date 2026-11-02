// entities/achievement — public API. Import from "@/entities/achievement",
// never reach into "@/entities/achievement/model/*" from outside this slice.
export type { AchievementUnlockRecord } from "./model/achievement-types";

export {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORY_LABELS,
  getAchievementById,
} from "./model/achievement-definitions";
export type {
  AchievementCategory,
  AchievementDefinition,
  AchievementEvaluation,
  AchievementProgress,
} from "./model/achievement-definitions";

export {
  buildAchievementPlayerContexts,
  evaluateAchievementsForPlayer,
} from "./model/achievement-engine";
export type {
  AchievementPlayerContext,
  AchievementState,
} from "./model/achievement-engine";

export {
  recordAchievementUnlock,
  getAchievementUnlocks,
  getAchievementUnlocksForPlayer,
  clearAchievementUnlocks,
} from "./model/achievement-unlock-db";

export {
  processAchievementsForCompletedGame,
  getAchievementsSnapshot,
  resetAchievements,
} from "./model/achievement-store";
export type {
  AchievementsSnapshot,
  UnlockedAchievementEvent,
} from "./model/achievement-store";