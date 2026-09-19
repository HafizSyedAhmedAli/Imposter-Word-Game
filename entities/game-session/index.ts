// entities/game-session — public API. Import from "@/entities/game-session",
// never reach into "@/entities/game-session/model/*" from outside this slice.
export type {
  GameMode,
  Difficulty,
  TimerSettings,
  GameOptions,
  GameConfig,
  GameSession,
} from "./model/game-session-types";
