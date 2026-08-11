import type {
  Category,
  Difficulty,
  GameConfig,
  GameMode,
  Player,
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

/* Player rules (Screen 3)                                            */
/*                                                                     */
/* Everything below governs *player setup only* -- how many players a */
/* mode needs, and whether a player name is acceptable. None of this   */
/* assigns roles, picks a word, or talks to the AI / IndexedDB layer.  */
/* ------------------------------------------------------------------ */

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const MAX_PLAYER_NAME_LENGTH = 20;

export const GAME_MODE_RULES: Record<
  GameMode,
  { minPlayers: number; maxPlayers: number }
> = {
  classic: { minPlayers: 3, maxPlayers: MAX_PLAYERS },
  double: { minPlayers: 5, maxPlayers: MAX_PLAYERS },
  triple: { minPlayers: 7, maxPlayers: MAX_PLAYERS },
  random: { minPlayers: 3, maxPlayers: MAX_PLAYERS },
};

const MODE_DISPLAY_NAME: Record<GameMode, string> = {
  classic: "Classic",
  double: "Double Trouble",
  triple: "Triple Threat",
  random: "Random",
};

export function getModeDisplayName(mode: GameMode): string {
  return MODE_DISPLAY_NAME[mode];
}

export function getMinimumPlayersForMode(mode: GameMode): number {
  return GAME_MODE_RULES[mode].minPlayers;
}

export function isPlayerCountValid(mode: GameMode, playerCount: number): boolean {
  const rules = GAME_MODE_RULES[mode];
  return playerCount >= rules.minPlayers && playerCount <= rules.maxPlayers;
}

export type PlayerCountStatus =
  | "empty"
  | "too-few-overall"
  | "mode-requirement"
  | "ready";

/**
 * Classifies the current player count against the selected mode so the
 * UI can pick the right message/card without re-deriving the thresholds
 * itself.
 */
export function getPlayerCountStatus(
  mode: GameMode,
  playerCount: number,
): PlayerCountStatus {
  if (playerCount === 0) return "empty";
  if (playerCount < MIN_PLAYERS) return "too-few-overall";
  if (!isPlayerCountValid(mode, playerCount)) return "mode-requirement";
  return "ready";
}

/**
 * Human-readable message for the current player-count/mode combination.
 * UI components can use `getPlayerCountStatus` directly when they need to
 * branch on more than just the text (e.g. picking an icon or color).
 */
export function getPlayerCountMessage(mode: GameMode, playerCount: number): string {
  const status = getPlayerCountStatus(mode, playerCount);
  switch (status) {
    case "empty":
      return "Add at least 3 players to begin.";
    case "too-few-overall":
      return "At least 3 players are required.";
    case "mode-requirement": {
      const minForMode = getMinimumPlayersForMode(mode);
      return `${getModeDisplayName(mode)} needs at least ${minForMode} players.`;
    }
    case "ready":
      return `${playerCount} players — ready to play!`;
  }
}

/**
 * Resolves the actual imposter count for a mode + player count. This is
 * the ONLY place that should ever decide how many imposters a round has
 * -- Screen 3 only uses it for UX messaging (e.g. "play with 3
 * imposters"); the game engine must re-run this same function before a
 * round actually starts rather than trusting anything the UI computed.
 *
 * classic / double / triple are fixed. random is balanced against the
 * player count:
 *   3–6 players   -> 1 imposter
 *   7–9 players   -> 2 imposters
 *   10–12 players -> 3 imposters
 */
export function getImposterCount(playerCount: number, mode: GameMode): number {
  if (mode === "classic") return 1;
  if (mode === "double") return 2;
  if (mode === "triple") return 3;

  // mode === "random"
  if (playerCount <= 6) return 1;
  if (playerCount <= 9) return 2;
  return 3;
}

export type PlayerNameValidation =
  | { valid: true; value: string }
  | { valid: false; error: string; value: string };

/**
 * Validates a candidate player name against the shared rules: non-empty
 * after trimming, within the max length, and unique (case-insensitively)
 * among the other players. Pass `editingId` when validating an in-place
 * edit so the player isn't compared against their own current name.
 */
export function validatePlayerName(
  name: string,
  players: Player[],
  editingId?: string,
): PlayerNameValidation {
  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, error: "Enter a player name.", value: trimmed };
  }

  if (trimmed.length > MAX_PLAYER_NAME_LENGTH) {
    return {
      valid: false,
      error: `Player names can be up to ${MAX_PLAYER_NAME_LENGTH} characters.`,
      value: trimmed,
    };
  }

  const isDuplicate = players.some(
    (p) => p.id !== editingId && p.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (isDuplicate) {
    return { valid: false, error: "Each player needs a unique name.", value: trimmed };
  }

  return { valid: true, value: trimmed };
}