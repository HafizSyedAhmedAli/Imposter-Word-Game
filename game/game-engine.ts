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
import { cacheAiWord } from "@/lib/db";
import { AiWordProvider } from "@/providers/ai-word-provider";
import { IndexedDbCacheProvider } from "@/providers/indexeddb-cache-provider";
import { FallbackWordProvider } from "@/providers/fallback-word-provider";

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
const cacheProvider = new IndexedDbCacheProvider();
const fallbackProvider = new FallbackWordProvider();

/**
 * The official 3-tier word source priority:
 *
 *   1. AI generation      (fresh, requires a working connection)
 *   2. IndexedDB AI cache (a previously AI-generated round, reused)
 *   3. Static fallback    (in-bundle array -- always succeeds)
 *
 * Never throws: tier 3 is a synchronous, non-empty constant, so this
 * function always resolves. The player never sees an "AI failed" or
 * "offline" message (see Screen 4 spec, section 27) -- whichever tier
 * wins is reflected only in `source`, shown as a small dev-facing badge
 * on Screen 4 and otherwise invisible to gameplay.
 */
async function getRoundContent(
  category: Category,
  difficulty: Difficulty,
  signal?: AbortSignal,
): Promise<GeneratedRoundContent> {
  // Skipping a guaranteed-to-fail AI attempt when the device is clearly
  // offline avoids a pointless ~10s timeout (see AiWordProvider) -- it's
  // a latency optimization, not a change to the priority order, since
  // AI genuinely cannot succeed with no connection either way.
  const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;

  if (isOnline) {
    try {
      const content = await aiProvider.generateRoundContent(
        category,
        difficulty,
        {
          signal,
        },
      );

      // Cache the fresh AI result for future offline rounds. Best-effort
      // and non-blocking to the round itself -- see cacheAiWord's doc
      // comment for why a failed write here must never surface as an
      // error to the player.
      void cacheAiWord({
        word: content.word,
        hint: content.hint,
        category,
        difficulty,
      });

      return content;
    } catch {
      if (signal?.aborted) throw new Error("Round preparation cancelled.");
      // Fall through to tier 2 below.
    }
  }

  try {
    return await cacheProvider.generateRoundContent(category, difficulty);
  } catch {
    if (signal?.aborted) throw new Error("Round preparation cancelled.");
    // Fall through to tier 3 below.
  }

  return fallbackProvider.generateRoundContent(category, difficulty);
}

/**
 * Coordinates the entire round-preparation pipeline: imposter count ->
 * word/hint (AI -> IndexedDB cache -> static fallback, see
 * getRoundContent above) -> role assignment -> a finished RoundSession.
 * This is the ONLY function the Round Preparation screen calls -- it
 * never talks to a provider or assigns roles itself (see
 * components/round/RoundPreparationScreen.tsx).
 *
 * In practice this never throws for word/hint reasons -- the tier-3
 * fallback always succeeds. The only remaining failure mode is an
 * invalid imposter count for the given player count/mode, which the
 * screen treats as the "something went wrong" recovery state.
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
    currentPlayerIndex: 0,
  };
}
