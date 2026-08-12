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
 * failed. Backed by a static, non-empty in-bundle array, so this is the
 * one provider in the chain that's guaranteed to succeed -- there's
 * nowhere further to fall back to.
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
