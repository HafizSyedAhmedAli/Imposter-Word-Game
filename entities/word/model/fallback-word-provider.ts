import type { Difficulty } from "@/entities/game-session";
import type { GeneratedRoundContent } from "@/entities/round";
import {
  ENGLISH,
  type Category,
  type GameLanguage,
} from "@/game/game-types";
import { getRandomFallbackWord } from "./fallback-words";
import type { WordProvider } from "./word-provider";

/**
 * NOTE on the `@/game/game-types` import above: see ./word-provider.ts.
 * Deliberate, temporary bridge.
 */

/**
 * TIER 3 -- final emergency fallback (see ./fallback-words/index.ts). Used
 * only when BOTH AI generation and the IndexedDB cache lookup have
 * failed. Backed by a static, in-bundle array that covers every real
 * category/difficulty combination, so this succeeds in practice -- but
 * it still enforces the selected category/difficulty exactly (see
 * getRandomFallbackWord) and throws rather than substituting a
 * mismatched entry in the (currently unreachable) case where no exact
 * match exists. There's nowhere further to fall back to after this.
 */
export class FallbackWordProvider implements WordProvider {
  async generateRoundContent(
    category: Category,
    difficulty: Difficulty,
    options?: { language?: GameLanguage },
  ): Promise<GeneratedRoundContent> {
    const language = options?.language ?? ENGLISH;
    const entry = getRandomFallbackWord(category, difficulty, language);
    return {
      word: entry.word,
      hint: entry.hint,
      source: "fallback",
      language: entry.language,
    };
  }
}