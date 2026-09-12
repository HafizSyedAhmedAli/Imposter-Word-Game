// lib/db.ts
import Dexie, { type Table } from "dexie";
import {
  ENGLISH,
  type Category,
  type Difficulty,
  type GameLanguage,
} from "@/game/game-types";
import { generateId } from "./id";
import { captureError } from "./monitoring";
import { getRecentWordIds, rememberWordId } from "./recent-words";
import {
  validateCustomWordText,
  type ExistingCustomWord,
} from "@/game/custom-word-rules";

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

/**
 * A cached round, always the result of a successful AI generation.
 * `source` is always `"ai"` -- this table is NOT a general-purpose word
 * collection, it's specifically "AI content we've seen before and can
 * reuse offline." The static emergency fallback list lives entirely
 * separately, in lib/fallback-words.ts, and must never be written here
 * (see cacheAiWord below).
 *
 * `normalizedWord`, `lastUsedAt`, and `usageCount` were added in v3 (see
 * migration below) to support persistent, cross-session duplicate
 * avoidance -- `lib/recent-words.ts`'s sessionStorage tracking only
 * covers "don't repeat within this browser tab session," not "spread
 * usage evenly across a long-lived install" (see getRandomCachedWord).
 */
export type WordEntry = {
  id: string;
  word: string;
  /** `word.trim().toLowerCase()`, kept in sync at write time so lookups
   * never have to recompute it. Used to catch case-only duplicates
   * (e.g. "Pizza" vs "pizza") without a full-table scan. */
  normalizedWord: string;
  hint: string;
  category: Category;
  difficulty: Difficulty;
  /**
   * Which language this cached round's word/hint pair is in. Added in
   * v5 (see migration below) -- kept alongside the content itself so
   * language-aware selection (getRandomCachedWord) never has to guess
   * from the text. Rows written before v5 are backfilled to "english"
   * by the migration; getRandomCachedWord/cacheAiWord also treat a
   * missing value as "english" defensively, in case a partially-applied
   * migration ever leaves a row without it.
   */
  language: GameLanguage;
  source: "ai";
  createdAt: number;
  /** Epoch ms this entry was last handed to a game, or `null` if it has
   * never been used. Drives the "least recently used" tier of
   * getRandomCachedWord's selection strategy. */
  lastUsedAt: number | null;
  /** How many times this entry has been selected for a round. Rows with
   * `usageCount === 0` are always preferred over previously-used ones. */
  usageCount: number;
};

/**
 * Device-local preference row (Settings screen: Sound, Haptics, ...).
 * Single-row table -- always read/written at the fixed `id: "app"` key
 * (see lib/settings-store.ts) since this app has no concept of multiple
 * local profiles. Kept in its own table rather than folded into `words`
 * so the two can evolve independently.
 */
export type SettingsRow = {
  id: string;
  sound: boolean;
  haptics: boolean;
  // Optional: rows saved before this feature existed won't have it --
  // getSettings() defaults it in, see lib/settings-store.ts.
  music?: boolean;
  // Optional for the same reason as `music` above -- rows saved before
  // the Language setting existed won't have it. getSettings() defaults
  // it to English, never trusting an unrecognized stored value either.
  language?: string;
};

/**
 * A user-saved Custom Word (Settings -> Custom Words). Deliberately its
 * own table, never folded into `words` above -- `words` is reserved
 * exclusively for AI-generated content (`source: "ai"`, see its doc
 * comment), and a hand-typed custom word is neither AI output nor safe
 * to evict under `MAX_CACHED_WORDS`. Keeping the two separate is what
 * lets `RoundData.contentSource` tell a custom word apart from a cached
 * AI one (see game/game-types.ts's `RoundContentSource`).
 */
export type CustomWordEntry = {
  id: string;
  word: string;
  /** `word.trim().toLowerCase()` -- same duplicate-detection convention
   * as `WordEntry.normalizedWord` above (see `addCustomWord`). */
  normalizedWord: string;
  category: Category;
  difficulty: Difficulty;
  createdAt: number;
  /**
   * A previously AI-generated (or otherwise resolved) hint for this
   * exact word, persisted so it can be reused offline without asking
   * the AI again every time this custom word is selected for a round.
   * Optional -- absent until the first round that actually uses this
   * word resolves a hint for it (see
   * providers/custom-word-provider.ts's `resolveCustomWordHint`).
   */
  hint?: string;
  /** Which language `hint` above is written in -- a cached English hint
   * must never be served for a Roman Urdu round, or vice versa. */
  hintLanguage?: GameLanguage;
};

class ImposterWordDB extends Dexie {
  words!: Table<WordEntry, string>;
  settings!: Table<SettingsRow, string>;
  customWords!: Table<CustomWordEntry, string>;

  constructor() {
    super("imposter-word-db");

    this.version(1).stores({
      words: "id, category, difficulty, [category+difficulty]",
    });

    // v2: this table's meaning changed from "general local word
    // collection (seeded with static content)" to "AI-generated cache
    // only". Any pre-existing rows are the old static seed data, not
    // real AI output, so they're wiped rather than migrated -- keeping
    // them would let non-AI content masquerade as `source: "ai"`. The
    // static list still exists (see lib/fallback-words.ts), it's just
    // never stored here anymore.
    this.version(2)
      .stores({
        words: "id, category, difficulty, [category+difficulty], createdAt",
      })
      .upgrade(async (tx) => {
        await tx.table("words").clear();
      });

    // v3: adds `normalizedWord`, `lastUsedAt`, `usageCount` for the
    // persistent-usage-tracking / LRU selection strategy described above.
    // Unlike v2, this migration is NON-DESTRUCTIVE -- every row written
    // since v2 is genuine AI content worth keeping, so existing rows are
    // upgraded in place with sensible defaults rather than cleared.
    this.version(3)
      .stores({
        words:
          "id, category, difficulty, [category+difficulty], createdAt, normalizedWord, lastUsedAt",
      })
      .upgrade(async (tx) => {
        await tx
          .table<WordEntry, string>("words")
          .toCollection()
          .modify((entry) => {
            // Defensive: only backfill fields that are actually missing,
            // so re-running an upgrade (or a partially-applied one) is
            // idempotent and never clobbers real data.
            if (typeof entry.normalizedWord !== "string") {
              entry.normalizedWord = entry.word.trim().toLowerCase();
            }
            if (typeof entry.lastUsedAt === "undefined") {
              entry.lastUsedAt = null;
            }
            if (typeof entry.usageCount !== "number") {
              entry.usageCount = 0;
            }
          });
      });

    // v4: adds the `settings` table (Settings screen: Sound, Haptics).
    // Purely additive -- existing `words` rows are untouched, and a new
    // empty table needs no upgrade function.
    this.version(4).stores({
      words:
        "id, category, difficulty, [category+difficulty], createdAt, normalizedWord, lastUsedAt",
      settings: "id",
    });

    // v5: adds `language` to the AI-cache table for the Roman Urdu
    // language feature. NON-DESTRUCTIVE, same spirit as v3: every row
    // written before this version is genuine AI content generated back
    // when the app only ever produced English, so it's backfilled to
    // "english" in place rather than cleared. `settings` needs no
    // schema change -- `language` there is an optional field read with
    // a default (see lib/settings-store.ts), the same pattern already
    // used for `music` in v4.
    this.version(5)
      .stores({
        words:
          "id, category, difficulty, [category+difficulty], createdAt, normalizedWord, lastUsedAt, language, [category+difficulty+language]",
        settings: "id",
      })
      .upgrade(async (tx) => {
        await tx
          .table<WordEntry, string>("words")
          .toCollection()
          .modify((entry) => {
            // Defensive, idempotent backfill -- same reasoning as v3's
            // upgrade above: only touch rows that are actually missing
            // the field.
            if (typeof entry.language !== "string") {
              entry.language = ENGLISH;
            }
          });
      });

    // v6: adds the `customWords` table (Custom Words feature). Purely
    // additive, same spirit as v4's `settings` table -- existing
    // `words`/`settings` rows are completely untouched, and a new empty
    // table needs no upgrade function.
    this.version(6).stores({
      words:
        "id, category, difficulty, [category+difficulty], createdAt, normalizedWord, lastUsedAt, language, [category+difficulty+language]",
      settings: "id",
      customWords:
        "id, category, difficulty, [category+difficulty], normalizedWord, createdAt",
    });
  }
}

let dbInstance: ImposterWordDB | null = null;

/**
 * Lazily creates the Dexie instance. IndexedDB doesn't exist during SSR,
 * so this must never run at module-import time -- only when a client
 * component actually needs the database.
 */
export function getDb(): ImposterWordDB {
  if (typeof window === "undefined") {
    throw new Error("getDb() can only be called in the browser.");
  }
  if (!dbInstance) {
    dbInstance = new ImposterWordDB();
  }
  return dbInstance;
}

/**
 * Caches a successfully AI-generated word/hint pair for future offline
 * use. Called ONLY after the AI provider has already returned and
 * validated content for the current round (see game/game-engine.ts) --
 * this function never generates or validates content itself.
 *
 * Best-effort and silent: a failed cache write must never fail the
 * round that's already in progress, since the word/hint have already
 * been decided by the time this runs.
 */
// Upper bound on how many AI rounds this table will hold. Without this,
// the table grows for the lifetime of the install -- eventually hitting
// IndexedDB quota, which fails writes silently (see the catch below).
// 500 is comfortably more than any offline session will exhaust, while
// still keeping the table small enough that a full scan in
// getRandomCachedWord stays cheap.
const MAX_CACHED_WORDS = 500;

export async function cacheAiWord(entry: {
  word: string;
  hint: string;
  category: Category;
  difficulty: Difficulty;
  /** Defaults to English -- see WordEntry.language's doc comment. */
  language?: GameLanguage;
}): Promise<void> {
  try {
    const db = getDb();
    const language = entry.language ?? ENGLISH;
    const normalizedWord = entry.word.trim().toLowerCase();

    // Skip if this exact word is already cached for this
    // category/difficulty/language. Without this, the AI returning the
    // same word twice (which it does -- there's no cross-call dedupe on
    // that side) creates multiple rows with different `id`s. Since
    // getRandomCachedWord's recent-word filter keys on `id`, duplicate
    // rows for the same word defeat repeat-word protection: the "recent"
    // copy gets filtered out, but an identical un-tracked copy is still
    // in the pool. Uses the `normalizedWord` field/index (v3) rather than
    // a per-row `.toLowerCase()` call so the check stays cheap as the
    // cache grows. `language` is part of the duplicate key -- an
    // English "Pizza" and a Roman Urdu "Pizza" (same word, different
    // hint) are deliberately allowed to coexist as separate rows (spec
    // section 14: cross-language entries must never be filtered against
    // each other).
    const duplicate = await db.words
      .where("[category+difficulty]")
      .equals([entry.category, entry.difficulty])
      .filter(
        (w) =>
          w.normalizedWord === normalizedWord &&
          (w.language ?? ENGLISH) === language,
      )
      .first();
    if (duplicate) return;

    await db.words.put({
      id: generateId(),
      word: entry.word,
      normalizedWord,
      hint: entry.hint,
      category: entry.category,
      difficulty: entry.difficulty,
      language,
      source: "ai",
      createdAt: Date.now(),
      lastUsedAt: null,
      usageCount: 0,
    });

    // Evict the oldest rows once the cache grows past its bound, using
    // the `createdAt` index added in v2.
    const count = await db.words.count();
    if (count > MAX_CACHED_WORDS) {
      const stale = await db.words
        .orderBy("createdAt")
        .limit(count - MAX_CACHED_WORDS)
        .primaryKeys();
      await db.words.bulkDelete(stale);
    }
  } catch (error) {
    // Non-fatal -- see doc comment above. Still worth knowing about in
    // aggregate (e.g. IndexedDB quota exhaustion) without ever blocking
    // or surfacing to the player.
    captureError(error, { phase: "cache-ai-word" });
  }
}

/**
 * Records that a cached round was just handed to a game: bumps
 * `usageCount` and stamps `lastUsedAt`, so future calls to
 * getRandomCachedWord can prefer less-recently-seen entries (see its
 * selection strategy below). Called fire-and-forget from
 * getRandomCachedWord itself -- usage bookkeeping must never delay or
 * fail the round that's already been selected, so failures here are
 * swallowed the same way cacheAiWord's are.
 */
export async function markRoundUsed(id: string): Promise<void> {
  try {
    const db = getDb();
    const entry = await db.words.get(id);
    if (!entry) return;
    await db.words.update(id, {
      usageCount: entry.usageCount + 1,
      lastUsedAt: Date.now(),
    });
  } catch (error) {
    // Non-fatal -- see doc comment above.
    captureError(error, { phase: "mark-round-used" });
  }
}

/**
 * TIER 2 -- looks up a previously cached AI round from IndexedDB.
 *
 * Selection rule (never relaxed):
 *   - difficulty MUST always match exactly.
 *   - category MUST always match exactly, UNLESS the selected category
 *     is "random", in which case any category is acceptable.
 *
 * Within that fixed set of valid entries, preference is applied in
 * tiers -- each tier only narrows the pool if doing so leaves at least
 * one candidate, so the game never fails to return a word just because
 * every entry happens to be "recent" or "used" (spec: don't guarantee
 * perfect uniqueness forever, just make repeats uncommon):
 *   1. Prefer entries not in this session's recent-word history
 *      (lib/recent-words.ts) -- avoids an immediate back-to-back repeat.
 *   2. Within that, prefer never-used entries (`usageCount === 0`),
 *      then the least-recently-used ones -- spreads usage evenly across
 *      the cache over the lifetime of the install instead of always
 *      drawing from the same handful of rows.
 * Once every entry has been used at least once, older/least-recently-used
 * entries are simply recycled -- this is the "allow reuse when
 * necessary" tier, not an error state.
 *
 * Returns `null` when nothing suitable is cached yet -- an empty/sparse
 * cache is an expected, normal state (e.g. the very first offline round
 * on a fresh install), not an error. The caller
 * (providers/indexeddb-cache-provider.ts) turns "null" into a
 * fall-through to tier 3.
 *
 * This function CAN reject: `getDb()` throws outside the browser, and
 * the IndexedDB read rejects when storage is unavailable. Tier 2 in
 * game/game-engine.ts catches both cases and falls through to tier 3.
 * The caller (providers/indexeddb-cache-provider.ts) is what turns
 * "null" into a fall-through to tier 3 -- this function must never
 * substitute a mismatched entry just to avoid returning null.
 */
export async function getRandomCachedWord(
  category: Category,
  difficulty: Difficulty,
  /** Defaults to English -- see WordEntry.language's doc comment. */
  language: GameLanguage = ENGLISH,
): Promise<WordEntry | null> {
  const db = getDb();
  const all = await db.words.toArray();
  if (all.length === 0) return null;

  const isRandomCategory = category === "random";
  const matching = all.filter(
    (w) =>
      (isRandomCategory || w.category === category) &&
      w.difficulty === difficulty &&
      // Rows cached before v5 have no `language` field -- treat them as
      // English (the only language that existed then), never silently
      // match them against a Roman Urdu request.
      (w.language ?? ENGLISH) === language,
  );
  if (matching.length === 0) return null;

  const recentIds = new Set(getRecentWordIds());
  const nonRecent = matching.filter((w) => !recentIds.has(w.id));
  const tier1 = nonRecent.length > 0 ? nonRecent : matching;

  // Within the tier-1 pool, prefer unused entries; if all of them have
  // been used before, fall back to the least-recently-used ones instead
  // of narrowing to an empty set.
  const unused = tier1.filter((w) => w.usageCount === 0);
  const tier2 = unused.length > 0 ? unused : tier1;

  const lowestUsageCount = Math.min(...tier2.map((w) => w.usageCount));
  const leastUsed = tier2.filter((w) => w.usageCount === lowestUsageCount);
  const oldestLastUsedAt = Math.min(...leastUsed.map((w) => w.lastUsedAt ?? 0));
  const pool = leastUsed.filter(
    (w) => (w.lastUsedAt ?? 0) === oldestLastUsedAt,
  );

  const entry = pool[Math.floor(Math.random() * pool.length)];
  rememberWordId(entry.id);
  void markRoundUsed(entry.id);

  return entry;
}

/**
 * Deletes all locally-cached AI rounds -- the data layer half of
 * "Reset Game Data" (see lib/reset-game-data.ts, which also clears
 * statistics and session-scoped tracking). Only ever touches this
 * table: built-in words live entirely outside IndexedDB (see
 * lib/fallback-words.ts), so there is nothing here that needs to be
 * preserved or distinguished by `source` -- every row in `words` is
 * AI-generated, user-local content by construction.
 *
 * Rethrows on failure (rather than swallowing, unlike cacheAiWord/
 * markRoundUsed above) because this is a user-initiated action that
 * needs to report success or failure back to the Settings screen --
 * silently doing nothing would leave the person thinking their data
 * was deleted when it wasn't.
 */
export async function resetUserData(): Promise<void> {
  const db = getDb();
  await db.words.clear();
}

/* -------------------------------------------------------------------- */
/* Custom Words (Settings -> Custom Words)                               */
/*                                                                        */
/* CRUD + selection for user-saved custom words. Kept in this file       */
/* (rather than a separate lib module) so every Dexie table this app has */
/* is defined and accessed from one place, matching the existing         */
/* words/settings functions above.                                       */
/* -------------------------------------------------------------------- */

export type AddCustomWordResult =
  | { ok: true; entry: CustomWordEntry }
  | { ok: false; error: string };

/**
 * Validates (game/custom-word-rules.ts) and saves a new custom word.
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
 * see providers/custom-word-provider.ts's `resolveCustomWordHint`, the
 * only caller. Best-effort and silent, same reasoning as `cacheAiWord`
 * above: a failed write here must never fail the round that's already
 * using the hint it was just given. Deliberately never logs `hint`
 * itself to Sentry -- only the `phase` tag, same as every other
 * `captureError` call in this file.
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
 * `getRandomCachedWord`'s exact category/difficulty match above): a
 * custom word pool is small and hand-curated by one player, so
 * requiring an exact difficulty match could easily leave zero
 * candidates (e.g. every saved word is "hard" but "easy" was selected).
 * Prefer an exact difficulty match; if none exists, fall back to any
 * saved custom word rather than failing the round -- matching the spec's
 * "custom word availability must never make the game unplayable."
 * Returns `null` only when there are no saved custom words at all; the
 * caller (game/game-engine.ts) falls through to the normal AI -> cache
 * -> fallback pipeline in that case.
 *
 * Reuses the same session-scoped recent-word tracking
 * (lib/recent-words.ts) as `getRandomCachedWord`, so a custom word is
 * subject to the same "avoid an immediate repeat" behavior as any other
 * source.
 */
export async function getRandomCustomWord(
  difficulty: Difficulty,
): Promise<CustomWordEntry | null> {
  const db = getDb();
  const all = await db.customWords.toArray();
  if (all.length === 0) return null;

  const exactDifficulty = all.filter((w) => w.difficulty === difficulty);
  const pool = exactDifficulty.length > 0 ? exactDifficulty : all;

  const recentIds = new Set(getRecentWordIds());
  const nonRecent = pool.filter((w) => !recentIds.has(w.id));
  const candidates = nonRecent.length > 0 ? nonRecent : pool;

  const entry = candidates[Math.floor(Math.random() * candidates.length)];
  rememberWordId(entry.id);
  return entry;
}

/**
 * Deletes every saved custom word -- the Custom Words half of "Reset
 * Game Data" (see lib/reset-game-data.ts). Rethrows on failure, same as
 * `resetUserData` above, since it's part of the same user-initiated,
 * must-report-failure reset action.
 */
export async function clearCustomWords(): Promise<void> {
  const db = getDb();
  await db.customWords.clear();
}
