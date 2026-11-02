// entities/statistics — public API. Import from "@/entities/statistics",
// never reach into "@/entities/statistics/model/*" from outside this slice.
export type {
  CompletedGamePlayerResult,
  CompletedGameRecord,
} from "./model/completed-game-store";
export {
  recordCompletedGame,
  getCompletedGames,
  clearCompletedGames,
} from "./model/completed-game-store";

export { buildCompletedGameRecord } from "./model/statistics-record";

export {
  computeGlobalStatistics,
  computePlayerStatistics,
  EMPTY_GLOBAL_STATISTICS,
  type GlobalStatistics,
  type PlayerStatistics,
} from "./model/statistics-aggregation";

export {
  recordFinalResult,
  getGameHistory,
  getStatisticsSnapshot,
  resetStatistics,
} from "./model/game-statistics-store";
