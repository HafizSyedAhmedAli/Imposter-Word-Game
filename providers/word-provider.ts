import type {
  Category,
  Difficulty,
  GameLanguage,
  GeneratedRoundContent,
} from "@/game/game-types";

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
