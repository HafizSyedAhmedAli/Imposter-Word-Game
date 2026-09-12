// game/game-engine.ts
import {
  ENGLISH,
  type Category,
  type Difficulty,
  type GameConfig,
  type GameLanguage,
  type GeneratedRoundContent,
  type Player,
  type RoundSession,
} from "./game-types";
import { CUSTOM_CATEGORY, getImposterCount } from "./game-rules";
import { assignRoles } from "./role-assignment";
import { generateId } from "@/lib/id";
import { cacheAiWord, getRandomCustomWord } from "@/lib/db";
import { getRecentWordText, rememberWordText } from "@/lib/recent-words";
import { AiWordProvider } from "@/providers/ai-word-provider";
import { IndexedDbCacheProvider } from "@/providers/indexeddb-cache-provider";
import { FallbackWordProvider } from "@/providers/fallback-word-provider";
import { resolveCustomWordHint } from "@/providers/custom-word-provider";
import { getSettings } from "@/lib/settings-store";
import { analytics, toRoundSource } from "@/lib/analytics";

export type PreparationStage = "word" | "hint" | "roles" | "finalizing";

export type PrepareRoundOptions = {
  /** Aborts an in-flight AI request and stops the pipeline early. */
  signal?: AbortSignal;
  /**
   * The content language for this round's word/hint. Defaults to
   * English for backward compatibility with any caller that doesn't
   * pass it. The caller (components/round/RoundPreparationScreen.tsx)
   * is expected to read this once from Settings right before starting
   * preparation -- once passed in here, it's fixed for the entire
   * round (see RoundData.language's doc comment for why).
   */
  language?: GameLanguage;
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
  language: GameLanguage,
  signal?: AbortSignal,
): Promise<GeneratedRoundContent> {
  // Skipping a guaranteed-to-fail AI attempt when the device is clearly
  // offline avoids a pointless ~10s timeout (see AiWordProvider) -- it's
  // a latency optimization, not a change to the priority order, since
  // AI genuinely cannot succeed with no connection either way.
  const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;

  if (isOnline) {
    try {
      // Tell the AI which words it (or another tier) has produced
      // recently in this session, so a static category/difficulty
      // prompt (e.g. "food" + "easy") doesn't keep collapsing onto the
      // same single most-obvious answer every round (see
      // lib/recent-words.ts's `getRecentWordText`).
      const content = await aiProvider.generateRoundContent(
        category,
        difficulty,
        {
          signal,
          excludeWords: getRecentWordText(),
          language,
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
        language: content.language,
      });

      rememberWordText(content.word);
      // AI succeeded and is what will actually serve this round --
      // analytics is fired here, not gated on anything downstream, and
      // never delays returning `content` to the caller.
      analytics.aiRoundGenerated();
      analytics.roundStarted({ source: toRoundSource(content.source) });
      return content;
    } catch {
      if (signal?.aborted) throw new Error("Round preparation cancelled.");
      // Tier 1 didn't pan out -- report the fallback once here,
      // regardless of which of tier 2/3 below ends up serving the round.
      analytics.aiRoundFallback();
      // Fall through to tier 2 below.
    }
  } else {
    // Skipped tier 1 outright because the device is offline (see the
    // comment above) -- AI was still effectively unavailable, so this
    // counts as a fallback the same as a failed request would.
    analytics.aiRoundFallback();
  }

  try {
    const content = await cacheProvider.generateRoundContent(
      category,
      difficulty,
      { language },
    );
    rememberWordText(content.word);
    analytics.roundStarted({ source: toRoundSource(content.source) });
    return content;
  } catch {
    if (signal?.aborted) throw new Error("Round preparation cancelled.");
    // Fall through to tier 3 below.
  }

  const content = await fallbackProvider.generateRoundContent(
    category,
    difficulty,
    { language },
  );
  rememberWordText(content.word);
  analytics.roundStarted({ source: toRoundSource(content.source) });
  return content;
}

/**
 * Custom Words tier: draws a random saved custom word (lib/db.ts) and
 * resolves its hint (providers/custom-word-provider.ts), instead of the
 * AI -> cache -> fallback chain above. Selected only when the round's
 * category is `CUSTOM_CATEGORY` (see `getRoundContentForRound` below).
 *
 * Never leaves the player stuck with no round: if there are no saved
 * custom words (or reading them fails for any reason -- e.g. IndexedDB
 * unavailable), this falls through to the exact same 3-tier pipeline
 * `getRoundContent` above provides for "Random", so a round can always
 * start (spec: "custom word availability must never make the game
 * unplayable").
 */
async function getCustomRoundContent(
  difficulty: Difficulty,
  language: GameLanguage,
  signal?: AbortSignal,
): Promise<GeneratedRoundContent> {
  try {
    const entry = await getRandomCustomWord(difficulty);
    if (entry) {
      const hint = await resolveCustomWordHint(entry, language, signal);
      if (signal?.aborted) throw new Error("Round preparation cancelled.");
      rememberWordText(entry.word);
      analytics.roundStarted({ source: toRoundSource("custom") });
      return {
        word: entry.word,
        hint,
        source: "custom",
        language,
      };
    }
  } catch {
    if (signal?.aborted) throw new Error("Round preparation cancelled.");
    // No custom words saved, or something went wrong reading them --
    // fall through to the standard pipeline below.
  }

  return getRoundContent("random", difficulty, language, signal);
}

/**
 * The single entry point `prepareGameRound` calls for word/hint content.
 * Dispatches to the Custom Words tier above when the player selected the
 * `CUSTOM_CATEGORY` pseudo-category (game/game-rules.ts); every other
 * category goes through the unmodified `getRoundContent` 3-tier chain
 * exactly as before this feature existed.
 */
async function getRoundContentForRound(
  category: Category,
  difficulty: Difficulty,
  language: GameLanguage,
  signal?: AbortSignal,
): Promise<GeneratedRoundContent> {
  if (category === CUSTOM_CATEGORY) {
    return getCustomRoundContent(difficulty, language, signal);
  }
  return getRoundContent(category, difficulty, language, signal);
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

  const language = options.language ?? (await getSettings()).language;

  await onStage?.("word");
  const content = await getRoundContentForRound(
    config.category,
    config.difficulty,
    language,
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
      language: content.language,
    },
    status: "ready",
    currentPlayerIndex: 0,
    // No one has voted yet -- Screen 7 doesn't exist until Screens 5/6
    // finish, but the field is initialized here (rather than lazily on
    // first entry to /voting) so `RoundSession` is always a complete,
    // valid shape the moment a round exists.
    votes: {},
  };
}
