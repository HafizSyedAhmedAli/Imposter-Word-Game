import type {
  Category,
  Difficulty,
  GeneratedRoundContent,
} from "@/game/game-types";
import { getRandomLocalWord } from "@/lib/local-words";
import type { WordProvider } from "./word-provider";

/**
 * Offline safety net (see lib/db.ts + lib/local-words.ts). This is what
 * keeps the game fully playable with no internet connection and no AI
 * service -- see game/game-engine.ts for how/when it's used. Throws only
 * if the local collection is completely empty/unreachable.
 */
export class LocalWordProvider implements WordProvider {
  async generateRoundContent(
    category: Category,
    difficulty: Difficulty,
  ): Promise<GeneratedRoundContent> {
    return getRandomLocalWord(category, difficulty);
  }
}
