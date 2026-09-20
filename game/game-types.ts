// game/game-types.ts

/**
 * Shared types for game configuration.
 *
 * These types describe *configuration only* -- how a round should be set
 * up. They intentionally know nothing about players, roles, words, or
 * scoring. Those concerns belong to the game engine / round provider that
 * consumes a `GameConfig` once the player list exists.
 */

/**
 * The content language for a round's word/hint (and its fallback/cache
 * data). This is deliberately separate from any UI-localization concept
 * -- see entities/settings for where the player's preference lives,
 * and game/game-engine.ts for how it gets fixed onto a RoundSession once
 * a round starts. Centralized here (rather than sprinkling raw string
 * literals across the codebase) so every layer -- settings, AI prompt,
 * Dexie schema, fallback data, round state -- shares one definition.
 */
export const ENGLISH = "english" as const;
export const ROMAN_URDU = "roman-urdu" as const;

export type GameLanguage = typeof ENGLISH | typeof ROMAN_URDU;

export const GAME_LANGUAGES: GameLanguage[] = [ENGLISH, ROMAN_URDU];

export function isGameLanguage(value: unknown): value is GameLanguage {
  return value === ENGLISH || value === ROMAN_URDU;
}

// Settings screen catalog (Language). Mirrors the CATEGORIES/DIFFICULTIES
// pattern in features/play-round/model/game-rules.ts -- the UI reads
// labels from here instead of hardcoding them, and this is the single
// source of truth for which languages the game actually supports (see
// entities/settings's DEFAULT_SETTINGS and
// app/api/round/generate/route.ts's server-side allow-list). Lives here
// rather than in features/play-round because entities/settings needs
// it too, and an entities/ slice importing from a features/ slice would
// be both a layer-direction violation and a real circular import
// (features/play-round's game-engine.ts imports `getSettings` from
// entities/settings).
export const LANGUAGES: {
  id: GameLanguage;
  label: string;
  description: string;
}[] = [
  {
    id: "english",
    label: "English",
    description: "Words and hints in English",
  },
  {
    id: "roman-urdu",
    label: "Roman Urdu",
    description: "Hints in Roman Urdu, written with English letters",
  },
];

export const DEFAULT_LANGUAGE: GameLanguage = "english";

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

/**
 * A player's public identity only. Screen 3 (Players) is the only place
 * this type is constructed -- it deliberately carries no secret game
 * state (no role, word, hint, or imposter flag). That information is
 * added later, per-round, by the Round Provider in Screen 4+.
 *
 * NOTE: this now lives in `entities/player` (see entities/README.md) --
 * this file re-exports it as a temporary bridge so the many existing
 * `import { Player } from "@/game/game-types"` call sites across
 * components/, game/, lib/, and providers/ don't all need touching in
 * this same change. Update those imports to `@/entities/player` as each
 * consumer is migrated; this re-export goes away once none are left.
 */
export type { Player } from "@/entities/player";

/**
 * NOTE: `GameMode`, `Difficulty`, `TimerSettings`, `GameOptions`,
 * `GameConfig`, and `GameSession` now live in `entities/game-session`
 * (see entities/README.md) -- this file re-exports them as a
 * temporary bridge so the many existing call sites across
 * components/, game/, lib/, and providers/ that still import them
 * from "@/game/game-types" keep working unchanged. Repoint each to
 * `@/entities/game-session` as it's touched; these re-exports go
 * away once none are left.
 */
export type {
  GameMode,
  Difficulty,
  TimerSettings,
  GameOptions,
  GameConfig,
  GameSession,
} from "@/entities/game-session";

/* -------------------------------------------------------------------- */
/* Round Preparation (Screen 4)                                          */
/*                                                                       */
/* NOTE: these types now live in `entities/round` (see                  */
/* entities/README.md) -- this file re-exports them as a temporary      */
/* bridge so the many existing call sites across components/, game/,    */
/* lib/, and providers/ that still import them from                     */
/* "@/game/game-types" keep working unchanged. Repoint each to          */
/* `@/entities/round` as it's touched; these re-exports go away once    */
/* none are left.                                                       */
/* -------------------------------------------------------------------- */
export type {
  RoundContentSource,
  GeneratedRoundContent,
  PlayerRole,
  RoundData,
  RoundStatus,
  RoundSession,
} from "@/entities/round";

/* -------------------------------------------------------------------- */
/* Voting History (Results / Final Results)                              */
/*                                                                       */
/* NOTE: these types now live in `entities/voting-history` (see         */
/* entities/README.md) -- this file re-exports them as a temporary      */
/* bridge so the many existing call sites across components/, game/,    */
/* and lib/ that still import them from "@/game/game-types" keep        */
/* working unchanged. Repoint each to `@/entities/voting-history` as    */
/* it's touched; these re-exports go away once none are left.           */
/* -------------------------------------------------------------------- */
export type {
  VotingHistoryTallyEntry,
  VotingHistoryVerdict,
  VotingHistoryEntry,
} from "@/entities/voting-history";
