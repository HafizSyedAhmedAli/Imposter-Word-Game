import type { Difficulty } from "@/entities/game-session";
import type { Category, GameLanguage } from "@/game/game-types";

/**
 * NOTE: `Category`/`GameLanguage` are still in the pre-FSD
 * `game/game-types.ts` -- see ../word-provider.ts. Temporary bridge.
 */

/**
 * A single TIER 3 (static fallback) word/hint pair. See ./index.ts for
 * how this tier fits into the overall 3-tier pipeline.
 */
export type FallbackWordEntry = {
  id: string;
  word: string;
  hint: string;
  category: Category;
  difficulty: Difficulty;
  /**
   * The language this static entry's word/hint were written in. Stored
   * explicitly (never inferred from the text) so getRandomFallbackWord
   * can filter by it directly -- same principle as WordEntry.language in
   * lib/db.ts. Every entry in this directory is tagged "english" or
   * "roman-urdu" accordingly; there is no untagged/legacy entry here
   * since this is a compile-time constant, not persisted user data.
   */
  language: GameLanguage;
};