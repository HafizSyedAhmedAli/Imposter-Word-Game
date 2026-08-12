import type {
  Category,
  Difficulty,
  GeneratedRoundContent,
} from "@/game/game-types";
import { getRandomFallbackWord } from "@/lib/fallback-words";
import type { WordProvider } from "./word-provider";

/**
 * TIER 3 -- final emergency fallback (see lib/fallback-words.ts). Used
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
  ): Promise<GeneratedRoundContent> {
    const entry = getRandomFallbackWord(category, difficulty);
    return { word: entry.word, hint: entry.hint, source: "fallback" };
  }
}
