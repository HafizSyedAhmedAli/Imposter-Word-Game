// entities/custom-word/model/custom-word-store.ts
import type { Difficulty } from "@/entities/game-session";
import type { Category, GameLanguage } from "@/game/game-types";
import { getDb } from "@/lib/db";
import { captureError } from "@/lib/monitoring";
import { getRecentWordIds, rememberWordId } from "@/lib/recent-words";
import { generateId } from "@/shared/lib/id";
import {
  validateCustomWordText,
  type ExistingCustomWord,
} from "./custom-word-rules";
import type { AddCustomWordResult, CustomWordEntry } from "./custom-word-types";

/**
 * NOTE on the imports above: `@/lib/db` (`getDb` -- the Dexie instance
 * and its `customWords` table schema stay put until `lib/db.ts` itself
 * moves, see ../../../shared/README.md), `@/lib/monitoring`,
 * `@/lib/recent-words`, and `@/game/game-types` (`Category`,
 * `GameLanguage`) are the pre-FSD locations. Deliberate, temporary
 * bridges. `lib/db.ts` in turn re-exports the functions below so its
 * existing consumers keep working -- see ../../README.md.
 */

/**
 * A strictly-increasing timestamp, used only for `CustomWordEntry.createdAt`.
 * Two custom words saved back-to-back (e.g. two `addCustomWord` calls in
 * the same test, or a fast successive real add) can land in the same
 * millisecond under plain `Date.now()`; `getCustomWords`'s
 * `orderBy("createdAt")` then breaks that tie by primary key (a random
 * UUID) instead of insertion order, so "newest first" silently stops
 * being true. This never returns the same or an earlier value than its
 * previous call, so insertion order is always preserved regardless of
 * how fast two saves happen.
 */
let lastCustomWordTimestamp = 0;
function nextCustomWordTimestamp(): number {
  lastCustomWordTimestamp = Math.max(Date.now(), lastCustomWordTimestamp + 1);
  return lastCustomWordTimestamp;
}

/* -------------------------------------------------------------------- */
/* Custom Words (Settings -> Custom Words)                               */
/*                                                                        */
/* CRUD + selection for user-saved custom words. Moved here from          */
/* lib/db.ts; the Dexie table they read and write is still declared      */
/* there.                                                                 */
/* -------------------------------------------------------------------- */

/**
 * Validates (./custom-word-rules.ts) and saves a new custom word.
 * Duplicate detection is case-insensitive and scoped to ALL of the
 * player's saved custom words (not just the same category/difficulty)
 * -- "Pizza" saved under Food/Easy and "pizza" under Food/Medium are
 * still the same word to a player reading their list back.
 */
export async function addCustomWord(input: {
  word: string;
  category: Category;
  difficulty: Difficulty;
}): Promise<AddCustomWordResult> {
  const db = getDb();
  const existing: ExistingCustomWord[] = await db.customWords
    .toArray()
    .then((rows) => rows.map((r) => ({ normalizedWord: r.normalizedWord })));

  const validation = validateCustomWordText(input.word, existing);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const entry: CustomWordEntry = {
    id: generateId(),
    word: validation.value,
    normalizedWord: validation.value.toLowerCase(),
    category: input.category,
    difficulty: input.difficulty,
    createdAt: nextCustomWordTimestamp(),
  };
  await db.customWords.put(entry);
  return { ok: true, entry };
}

/**
 * All saved custom words, newest first -- the order the management
 * screen (Settings -> Custom Words) displays them in.
 */
export async function getCustomWords(): Promise<CustomWordEntry[]> {
  const db = getDb();
  return db.customWords.orderBy("createdAt").reverse().toArray();
}

/**
 * Deletes a single saved custom word. Never affects a round already in
 * progress -- `RoundData.word`/`hint` are plain strings copied onto the
 * round once at preparation time (see game/game-engine.ts), so an
 * active round has no live reference back to this table to be disrupted
 * by a deletion here (spec: "Custom Word Deletion During A Game" /
 * "Game State Isolation").
 */
export async function deleteCustomWord(id: string): Promise<void> {
  const db = getDb();
  await db.customWords.delete(id);
}

/**
 * Persists a resolved hint back onto a custom word so future rounds
 * (including offline ones) can reuse it without asking the AI again --
 * see ./custom-word-provider.ts's `resolveCustomWordHint`, the
 * only caller. Best-effort and silent, same reasoning as `cacheAiWord`
 * in lib/db.ts: a failed write here must never fail the round that's
 * already using the hint it was just given. Deliberately never logs
 * `hint` itself to Sentry -- only the `phase` tag, same as every other
 * `captureError` call in lib/db.ts.
 */
export async function updateCustomWordHint(
  id: string,
  hint: string,
  language: GameLanguage,
): Promise<void> {
  try {
    const db = getDb();
    await db.customWords.update(id, { hint, hintLanguage: language });
  } catch (error) {
    captureError(error, { phase: "update-custom-word-hint" });
  }
}

/**
 * Selects a random saved custom word for a round.
 *
 * Selection rule (deliberately more forgiving than
 * `getRandomCachedWord`'s exact category/difficulty match in
 * lib/db.ts): a custom word pool is small and hand-curated by one
 * player, so requiring an exact difficulty match could easily leave
 * zero candidates (e.g. every saved word is "hard" but "easy" was
 * selected). Prefer an exact difficulty match; if none exists, fall
 * back to any saved custom word rather than failing the round --
 * matching the spec's "custom word availability must never make the
 * game unplayable." Returns `null` only when there are no saved custom
 * words at all; the caller (game/game-engine.ts) falls through to the
 * normal AI -> cache -> fallback pipeline in that case.
 *
 * `category`, when given, narrows the pool to that one category first
 * (Setup screen's Custom Words toggle -- see
 * features/configure-game/ui/CategorySelector.tsx and
 * `GameConfig.customWordCategory`). Same forgiving spirit as the
 * difficulty match above: if narrowing to `category` would leave zero
 * candidates (e.g. the player deleted every word in that category from
 * Settings after starting Setup, or restored a stale session), this
 * falls back to the player's full saved list rather than failing the
 * round. Omitting `category` entirely (existing callers/tests) searches
 * every saved custom word, exactly as before this parameter existed.
 *
 * Deliberately still uses the capped `getRecentWordIds` tracker (NOT
 * `getShownWordIds`) -- a custom word list is small and hand-curated,
 * and this selector already falls back to repeating when narrowing
 * would leave zero candidates (see above), so it only ever needs
 * "avoid an immediate repeat," not full-session exhaustion detection.
 */
export async function getRandomCustomWord(
  difficulty: Difficulty,
  category?: Category,
): Promise<CustomWordEntry | null> {
  const db = getDb();
  const all = await db.customWords.toArray();
  if (all.length === 0) return null;

  const categoryPool = category
    ? all.filter((w) => w.category === category)
    : all;
  const basePool = categoryPool.length > 0 ? categoryPool : all;

  const exactDifficulty = basePool.filter((w) => w.difficulty === difficulty);
  const pool = exactDifficulty.length > 0 ? exactDifficulty : basePool;

  const recentIds = new Set(getRecentWordIds());
  const nonRecent = pool.filter((w) => !recentIds.has(w.id));
  const candidates = nonRecent.length > 0 ? nonRecent : pool;

  const entry = candidates[Math.floor(Math.random() * candidates.length)];
  rememberWordId(entry.id);
  return entry;
}

/**
 * Deletes every saved custom word -- the Custom Words half of "Reset
 * Game Data" (see features/reset-game-data/model/reset-game-data.ts). Rethrows on failure, same as
 * `resetUserData` in lib/db.ts, since it's part of the same
 * user-initiated, must-report-failure reset action.
 */
export async function clearCustomWords(): Promise<void> {
  const db = getDb();
  await db.customWords.clear();
}