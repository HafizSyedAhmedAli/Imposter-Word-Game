// lib/db.ts
import Dexie, { type Table } from "dexie";
import type { Category, Difficulty } from "@/game/game-types";
import { generateId } from "./id";
import { getRecentWordIds, rememberWordId } from "./recent-words";

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

class ImposterWordDB extends Dexie {
  words!: Table<WordEntry, string>;

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
}): Promise<void> {
  try {
    const db = getDb();
    const normalizedWord = entry.word.trim().toLowerCase();

    // Skip if this exact word is already cached for this
    // category/difficulty. Without this, the AI returning the same word
    // twice (which it does -- there's no cross-call dedupe on that side)
    // creates multiple rows with different `id`s. Since
    // getRandomCachedWord's recent-word filter keys on `id`, duplicate
    // rows for the same word defeat repeat-word protection: the "recent"
    // copy gets filtered out, but an identical un-tracked copy is still
    // in the pool. Uses the `normalizedWord` field/index (v3) rather than
    // a per-row `.toLowerCase()` call so the check stays cheap as the
    // cache grows.
    const duplicate = await db.words
      .where("[category+difficulty]")
      .equals([entry.category, entry.difficulty])
      .filter((w) => w.normalizedWord === normalizedWord)
      .first();
    if (duplicate) return;

    await db.words.put({
      id: generateId(),
      word: entry.word,
      normalizedWord,
      hint: entry.hint,
      category: entry.category,
      difficulty: entry.difficulty,
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
  } catch {
    // Non-fatal -- see doc comment above.
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
  } catch {
    // Non-fatal -- see doc comment above.
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
): Promise<WordEntry | null> {
  const db = getDb();
  const all = await db.words.toArray();
  if (all.length === 0) return null;

  const isRandomCategory = category === "random";
  const matching = all.filter(
    (w) =>
      (isRandomCategory || w.category === category) &&
      w.difficulty === difficulty,
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
