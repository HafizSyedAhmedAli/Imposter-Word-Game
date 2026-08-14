import type {
  Category,
  Difficulty,
  GeneratedRoundContent,
} from "@/game/game-types";

/**
 * Anything that can produce round content (a word + hint pair) for a
 * given category/difficulty. The game engine (game/game-engine.ts) only
 * ever depends on this interface -- never on AI or IndexedDB directly --
 * so the two implementations stay fully interchangeable and the app is
 * never hard-wired to "the internet is required."
 */
export interface WordProvider {
  generateRoundContent(
    category: Category,
    difficulty: Difficulty,
    options?: { signal?: AbortSignal; excludeWords?: string[] },
  ): Promise<GeneratedRoundContent>;
}
