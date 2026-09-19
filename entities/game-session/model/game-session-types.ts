// entities/game-session/model/game-session-types.ts
import type { Player } from "@/entities/player";
import type { Category } from "@/game/game-types";

/**
 * NOTE on the import above: `Category` is still defined in the pre-FSD
 * `game/game-types.ts` -- see ../../README.md. `entities/word` now
 * exists, but `Category` deliberately did not move into it: that slice's
 * `WordProvider` needs `Difficulty` from here, so moving `Category` alone
 * would make the two slices depend on each other. This entity depends on
 * it as a deliberate, temporary bridge; resolve by moving `Category` and
 * `Difficulty` into `entities/word` together.
 */

/**
 * Shared types for game configuration. These types describe
 * *configuration only* -- how a round should be set up. They
 * intentionally know nothing about words, roles, or scoring; those
 * concerns belong to `entities/round` and the game engine that
 * consumes a `GameConfig` once the player list exists.
 */
export type GameMode = "classic" | "double" | "triple" | "random";

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
  /**
   * Which concrete category to draw a Custom Word from, e.g. "food".
   * Only meaningful when `category === CUSTOM_CATEGORY` (see
   * game/game-rules.ts) -- every other category ignores this field
   * entirely. Set by the Setup screen's Custom Words toggle
   * (components/setup/CategorySelector.tsx) once the player picks
   * which of their saved custom-word categories to play from; `game
   * -engine.ts`'s `getCustomRoundContent` reads it to scope
   * `getRandomCustomWord` (lib/db.ts) down to that one category
   * instead of the player's entire saved list.
   */
  customWordCategory?: Category;
  difficulty: Difficulty;
  options: GameOptions;
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