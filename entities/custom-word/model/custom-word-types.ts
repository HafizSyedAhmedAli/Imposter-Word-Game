// entities/custom-word/model/custom-word-types.ts
import type { Difficulty } from "@/entities/game-session";
import type { Category, GameLanguage } from "@/game/game-types";

/**
 * NOTE on the `@/game/game-types` import above: `Category` and
 * `GameLanguage` are still defined in the pre-FSD `game/game-types.ts`
 * -- see ../../README.md. Deliberate, temporary bridge.
 */

/**
 * A user-saved Custom Word (Settings -> Custom Words). Deliberately its
 * own table, never folded into `words` (lib/db.ts) -- `words` is reserved
 * exclusively for AI-generated content (`source: "ai"`, see its doc
 * comment), and a hand-typed custom word is neither AI output nor safe
 * to evict under `MAX_CACHED_WORDS`. Keeping the two separate is what
 * lets `RoundData.contentSource` tell a custom word apart from a cached
 * AI one (see `RoundContentSource` in entities/round).
 *
 * The Dexie table itself (`customWords`, with its schema versions and
 * migrations) is still declared in lib/db.ts, which imports this type --
 * see ../../README.md.
 */
export type CustomWordEntry = {
  id: string;
  word: string;
  /** `word.trim().toLowerCase()` -- same duplicate-detection convention
   * as `WordEntry.normalizedWord` in lib/db.ts (see `addCustomWord`). */
  normalizedWord: string;
  category: Category;
  difficulty: Difficulty;
  createdAt: number;
  /**
   * A previously AI-generated (or otherwise resolved) hint for this
   * exact word, persisted so it can be reused offline without asking
   * the AI again every time this custom word is selected for a round.
   * Optional -- absent until the first round that actually uses this
   * word resolves a hint for it (see ./custom-word-provider.ts's
   * `resolveCustomWordHint`).
   */
  hint?: string;
  /** Which language `hint` above is written in -- a cached English hint
   * must never be served for a Roman Urdu round, or vice versa. */
  hintLanguage?: GameLanguage;
};

export type AddCustomWordResult =
  | { ok: true; entry: CustomWordEntry }
  | { ok: false; error: string };