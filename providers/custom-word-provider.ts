import {
  ENGLISH,
  ROMAN_URDU,
  type Category,
  type Difficulty,
  type GameLanguage,
} from "@/game/game-types";
import { validateRomanUrduHint } from "@/game/round-validation";
import { updateCustomWordHint, type CustomWordEntry } from "@/lib/db";

const AI_TIMEOUT_MS = 10_000;

// Same reasoning as providers/ai-word-provider.ts's API_BASE_URL: empty
// (same-origin) on web, set at build time for the Capacitor app.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * Static, language-aware, never-reveals-the-word hint used only when a
 * fresh AI hint can't be obtained (offline, request failure, or no
 * cached hint yet) -- the tier-3-equivalent "always succeeds" fallback
 * for Custom Words, mirroring lib/fallback-words.ts's role for the
 * normal AI -> cache -> fallback pipeline. Deliberately generic (it
 * can't know anything about the word itself) but still satisfies "the
 * hint must never simply restate the word."
 */
const GENERIC_HINT: Record<GameLanguage, string> = {
  [ENGLISH]: "A word one of the players picked before this game started.",
  [ROMAN_URDU]:
    "Yeh lafz kisi player ne game shuru hone se pehle khud chuna tha.",
};

/**
 * Resolves the hint half of a Custom Word's round content. The word
 * itself never changes -- it's exactly what the player saved (spec:
 * "the word itself should be used as the secret word") -- only the hint
 * needs resolving, in priority order:
 *
 *   1. A hint already generated for this exact word, in this exact
 *      language, previously (persisted on the CustomWordEntry itself --
 *      see lib/db.ts's `updateCustomWordHint`). Works fully offline once
 *      it exists, and never asks the AI again for a word it already has
 *      a good hint for.
 *   2. A fresh AI-generated hint for this specific word, via the
 *      existing AI route's hint-only mode (app/api/round/generate/route.ts)
 *      -- reusing the existing AI hint-generation system rather than
 *      building a second one, per spec.
 *   3. The static, language-aware generic hint above -- never fails,
 *      never reveals the word, and needs no network. Guarantees Custom
 *      Words work offline exactly like every other word source (spec:
 *      "Do NOT allow AI availability to make Custom Words unusable").
 *
 * Never throws -- the caller (game/game-engine.ts) must always end up
 * with a usable hint, the same "never breaks the round" guarantee the
 * rest of the round-content pipeline provides.
 */
export async function resolveCustomWordHint(
  entry: CustomWordEntry,
  language: GameLanguage,
  signal?: AbortSignal,
): Promise<string> {
  if (entry.hint && entry.hintLanguage === language) {
    return entry.hint;
  }

  const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;
  if (isOnline) {
    // requestHintForWord never throws for an ordinary failure (network
    // error, bad response, failed validation) -- it resolves `null`, and
    // this simply falls through to the generic hint below. Cancellation
    // itself is handled by the caller (game/game-engine.ts checks
    // `signal.aborted` right after this function returns), so there's no
    // separate abort-handling path needed here.
    const hint = await requestHintForWord(
      entry.word,
      entry.category,
      entry.difficulty,
      language,
      signal,
    );
    if (hint) {
      // Best-effort persistence for future offline reuse -- never lets a
      // failed write affect the round already using this hint (same
      // philosophy as lib/db.ts's cacheAiWord).
      void updateCustomWordHint(entry.id, hint, language);
      return hint;
    }
  }

  return GENERIC_HINT[language] ?? GENERIC_HINT[ENGLISH];
}

/**
 * Calls the AI route's hint-only mode (a `word` field present in the
 * request body -- see app/api/round/generate/route.ts) for a single
 * custom word. Returns `null` on any failure; never throws for a normal
 * failure (only for an aborted signal), matching AiWordProvider's
 * "callers decide how to fall back" contract.
 */
async function requestHintForWord(
  word: string,
  category: Category,
  difficulty: Difficulty,
  language: GameLanguage,
  signal?: AbortSignal,
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort);

  try {
    const response = await fetch(`${API_BASE_URL}/api/round/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, category, difficulty, language }),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const data: unknown = await response.json();
    const candidate =
      typeof data === "object" && data !== null
        ? (data as { hint?: unknown })
        : {};

    if (typeof candidate.hint !== "string") return null;
    const hint = candidate.hint.trim();
    if (!hint) return null;
    if (hint.toLowerCase().includes(word.toLowerCase())) return null;

    if (language === ROMAN_URDU) {
      const scriptCheck = validateRomanUrduHint(hint);
      if (!scriptCheck.valid) return null;
    }

    return hint;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onExternalAbort);
  }
}
