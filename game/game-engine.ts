import type {
  Category,
  Difficulty,
  GameConfig,
  GeneratedRoundContent,
  Player,
  RoundSession,
} from "./game-types";
import { getImposterCount } from "./game-rules";
import { assignRoles } from "./role-assignment";
import { generateId } from "@/lib/id";
import { AiWordProvider } from "@/providers/ai-word-provider";
import { LocalWordProvider } from "@/providers/local-word-provider";

export type PreparationStage = "word" | "hint" | "roles" | "finalizing";

export type PrepareRoundOptions = {
  /** Aborts an in-flight AI request and stops the pipeline early. */
  signal?: AbortSignal;
  /**
   * Called as each stage begins, so the UI can update its status text /
   * progress meter. May return a promise -- the engine awaits it, which
   * lets the screen give a stage a minimum on-screen duration without the
   * engine itself needing to know anything about pacing.
   */
  onStage?: (stage: PreparationStage) => void | Promise<void>;
};

const aiProvider = new AiWordProvider();
const localProvider = new LocalWordProvider();

async function getRoundContent(
  category: Category,
  difficulty: Difficulty,
  signal?: AbortSignal,
): Promise<GeneratedRoundContent> {
  const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;

  if (isOnline) {
    try {
      return await aiProvider.generateRoundContent(category, difficulty, {
        signal,
      });
    } catch {
      // AI down, slow, or returned something invalid -- silently fall
      // back to the offline collection. The player must never see "AI
      // failed" (see Screen 4 spec, section 27).
      if (signal?.aborted) throw new Error("Round preparation cancelled.");
      return localProvider.generateRoundContent(category, difficulty);
    }
  }

  return localProvider.generateRoundContent(category, difficulty);
}

/**
 * Coordinates the entire round-preparation pipeline: imposter count ->
 * word/hint (AI, with local fallback) -> role assignment -> a finished
 * RoundSession. This is the ONLY function the Round Preparation screen
 * calls -- it never talks to a provider or assigns roles itself (see
 * components/round/RoundPreparationScreen.tsx).
 *
 * Throws only when BOTH the AI provider and the local collection fail --
 * the screen treats that as the "something went wrong" recovery state.
 */
export async function prepareGameRound(
  config: GameConfig,
  players: Player[],
  options: PrepareRoundOptions = {},
): Promise<RoundSession> {
  const { signal, onStage } = options;

  const imposterCount = getImposterCount(players.length, config.mode);
  if (imposterCount < 1 || imposterCount >= players.length) {
    throw new Error("Imposter count is not valid for this player count.");
  }

  await onStage?.("word");
  const content = await getRoundContent(
    config.category,
    config.difficulty,
    signal,
  );
  if (signal?.aborted) throw new Error("Round preparation cancelled.");

  // Word + hint are generated together by the provider (see
  // providers/word-provider.ts) -- this stage exists purely so the UI can
  // show a distinct "crafting a hint" beat once content is already in hand.
  await onStage?.("hint");
  if (signal?.aborted) throw new Error("Round preparation cancelled.");

  await onStage?.("roles");
  const roles = assignRoles(players, imposterCount);
  if (signal?.aborted) throw new Error("Round preparation cancelled.");

  await onStage?.("finalizing");

  return {
    id: generateId(),
    config,
    players,
    round: {
      number: 1,
      word: content.word,
      hint: content.hint,
      imposterCount,
      roles,
      contentSource: content.source,
    },
    status: "ready",
  };
}
