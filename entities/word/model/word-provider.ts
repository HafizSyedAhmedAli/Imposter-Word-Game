import type { Difficulty } from "@/entities/game-session";
import type { GeneratedRoundContent } from "@/entities/round";
import type { Category, GameLanguage } from "@/game/game-types";

/**
 * NOTE on the imports above: `Category` and `GameLanguage` are still
 * defined in the pre-FSD `game/game-types.ts` -- see ../../README.md.
 * `Category` can't move into this slice yet without making
 * `entities/game-session` and this slice depend on each other (this
 * interface needs `Difficulty` from there, and `GameConfig` there needs
 * `Category` from here); `GameLanguage` hasn't been assigned a slice.
 * `Difficulty` and `GeneratedRoundContent` come straight from their own
 * slices' public APIs. Update the `game/game-types` import once that
 * decision is made.
 */

/**
 * Anything that can produce round content (a word + hint pair) for a
 * given category/difficulty. The game engine (game/game-engine.ts) only
 * ever depends on this interface -- never on AI or IndexedDB directly --
 * so the two implementations stay fully interchangeable and the app is
 * never hard-wired to "the internet is required."
 *
 * `language` lives on the shared `options` object (rather than as its
 * own positional parameter) so all three implementations -- which don't
 * all need `signal`/`excludeWords` -- keep one consistent call shape.
 * Every implementation defaults it to English when omitted, so existing
 * callers (and existing tests) that don't pass it keep working exactly
 * as before Roman Urdu existed.
 */
export interface WordProvider {
  generateRoundContent(
    category: Category,
    difficulty: Difficulty,
    options?: {
      signal?: AbortSignal;
      excludeWords?: string[];
      language?: GameLanguage;
    },
  ): Promise<GeneratedRoundContent>;
}
