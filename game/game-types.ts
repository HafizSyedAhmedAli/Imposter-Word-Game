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