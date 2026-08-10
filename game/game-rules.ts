import type {
  Category,
  Difficulty,
  GameConfig,
  GameMode,
} from "./game-types";

/**
 * Central definitions for game setup. The Setup UI reads from this module
 * instead of hardcoding labels/values, so future screens (and the round
 * provider) share a single source of truth.
 *
 * IMPORTANT: This module only describes *configuration*. It does not
 * assign roles, pick words, or talk to the AI / IndexedDB layer -- that
 * lives in the round provider, which runs after players are known.
 */

export const GAME_MODES: {
  id: GameMode;
  title: string;
  subtitle: string;
}[] = [
  { id: "classic", title: "CLASSIC", subtitle: "1 Imposter" },
  { id: "double", title: "DOUBLE TROUBLE", subtitle: "2 Imposters" },
  { id: "triple", title: "TRIPLE THREAT", subtitle: "3 Imposters" },
  { id: "random", title: "RANDOM", subtitle: "Let the game decide" },
];

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "random", label: "Random" },
  { id: "food", label: "Food" },
  { id: "animals", label: "Animals" },
  { id: "sports", label: "Sports" },
  { id: "movies", label: "Movies" },
  { id: "countries", label: "Countries" },
  { id: "more", label: "More" },
];

// Extra categories surfaced from the "More" sheet. Kept short for the MVP;
// this list is easy to extend without touching any component.
export const MORE_CATEGORIES: { id: Category; label: string }[] = [
  { id: "vehicles", label: "Vehicles" },
  { id: "jobs", label: "Jobs" },
  { id: "nature", label: "Nature" },
  { id: "everyday", label: "Everyday Things" },
  { id: "technology", label: "Technology" },
  { id: "places", label: "Places" },
  { id: "objects", label: "Random Objects" },
];

export const DIFFICULTIES: {
  id: Difficulty;
  title: string;
  description: string;
}[] = [
  { id: "easy", title: "EASY", description: "Common words & clearer hints" },
  { id: "medium", title: "MEDIUM", description: "Balanced words & indirect hints" },
  { id: "hard", title: "HARD", description: "Harder words & subtle hints" },
];

export const DISCUSSION_TIMER_OPTIONS = [30, 45, 60, 90, 120] as const;
export const VOTING_TIMER_OPTIONS = [15, 30, 45, 60, 90] as const;

export const DEFAULT_GAME_CONFIG: GameConfig = {
  mode: "classic",
  category: "random",
  difficulty: "medium",
  options: {
    discussionTimer: { enabled: true, duration: 60 },
    votingTimer: { enabled: true, duration: 30 },
  },
};

/**
 * Balancing rules for imposter count. This is the ONLY place that should
 * ever decide how many imposters a round has -- the Setup UI just stores
 * the chosen `mode`; this function (called later, once the player count is
 * known) resolves it to an actual number.
 */
export function getImposterCount(playerCount: number, mode: GameMode): number {
  if (mode === "classic") return 1;
  if (mode === "double") return 2;
  if (mode === "triple") return 3;

  // mode === "random" -- balance against player count.
  if (playerCount <= 6) return 1;
  if (playerCount <= 8) return playerCount <= 7 ? 1 : 2;
  if (playerCount <= 10) return 2;
  return 3; // 11-12 players
}

/**
 * Whether Triple Threat is a sensible choice for a given player count.
 * The Setup screen never auto-changes the player's selection -- this is
 * exposed so Screen 3 can validate and show a clear message instead.
 */
export function isTripleThreatAvailable(playerCount: number): boolean {
  return playerCount >= 7;
}

export function validateGameConfig(config: GameConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!GAME_MODES.some((m) => m.id === config.mode)) {
    errors.push("Please select a game mode.");
  }

  if (!config.category) {
    errors.push("Please select a category.");
  }

  if (!DIFFICULTIES.some((d) => d.id === config.difficulty)) {
    errors.push("Please select a difficulty.");
  }

  if (
    config.options.discussionTimer.enabled &&
    !DISCUSSION_TIMER_OPTIONS.includes(
      config.options.discussionTimer.duration as (typeof DISCUSSION_TIMER_OPTIONS)[number]
    )
  ) {
    errors.push("Please choose a valid discussion timer duration.");
  }

  if (
    config.options.votingTimer.enabled &&
    !VOTING_TIMER_OPTIONS.includes(
      config.options.votingTimer.duration as (typeof VOTING_TIMER_OPTIONS)[number]
    )
  ) {
    errors.push("Please choose a valid voting timer duration.");
  }

  return { valid: errors.length === 0, errors };
}