/**
 * Shared types for game configuration.
 *
 * These types describe *configuration only* -- how a round should be set
 * up. They intentionally know nothing about players, roles, words, or
 * scoring. Those concerns belong to the game engine / round provider that
 * consumes a `GameConfig` once the player list exists.
 */

export type GameMode = "classic" | "double" | "triple" | "random";

// Category is deliberately kept open-ended (`| string`) so that additional
// categories added later via the "More" sheet, or loaded from a local
// category catalog, don't require a type change here.
export type Category =
  | "random"
  | "food"
  | "animals"
  | "sports"
  | "movies"
  | "countries"
  | string;

export type Difficulty = "easy" | "medium" | "hard";

export type TimerSettings = {
  enabled: boolean;
  duration: number; // seconds
};

export type GameOptions = {
  discussionTimer: TimerSettings;
  votingTimer: TimerSettings;
};

export type GameConfig = {
  mode: GameMode;
  category: Category;
  difficulty: Difficulty;
  options: GameOptions;
};

/**
 * A player's public identity only. Screen 3 (Players) is the only place
 * this type is constructed -- it deliberately carries no secret game
 * state (no role, word, hint, or imposter flag). That information is
 * added later, per-round, by the Round Provider in Screen 4+.
 */
export type Player = {
  id: string;
  name: string;
};

/**
 * The handoff shape passed from Players (Screen 3) into Round Preparation
 * (Screen 4). Roles/word/hint are intentionally absent here -- Screen 4
 * is responsible for generating/loading them and assigning roles.
 */
export type GameSession = {
  config: GameConfig;
  players: Player[];
};