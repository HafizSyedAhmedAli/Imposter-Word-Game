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
 */
export type WordEntry = {
  id: string;
  word: string;
  hint: string;
  category: Category;
  difficulty: Difficulty;
  source: "ai";
  createdAt: number;
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

    // Skip if this exact word is already cached for this
    // category/difficulty. Without this, the AI returning the same word
    // twice (which it does -- there's no cross-call dedupe on that side)
    // creates multiple rows with different `id`s. Since
    // getRandomCachedWord's recent-word filter keys on `id`, duplicate
    // rows for the same word defeat repeat-word protection: the "recent"
    // copy gets filtered out, but an identical un-tracked copy is still
    // in the pool.
    const duplicate = await db.words
      .where("[category+difficulty]")
      .equals([entry.category, entry.difficulty])
      .filter((w) => w.word.toLowerCase() === entry.word.toLowerCase())
      .first();
    if (duplicate) return;

    await db.words.put({
      id: generateId(),
      word: entry.word,
      hint: entry.hint,
      category: entry.category,
      difficulty: entry.difficulty,
      source: "ai",
      createdAt: Date.now(),
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
 * TIER 2 -- looks up a previously cached AI round from IndexedDB.
 *
 * Selection rule (never relaxed):
 *   - difficulty MUST always match exactly.
 *   - category MUST always match exactly, UNLESS the selected category
 *     is "random", in which case any category is acceptable.
 *
 * Within that fixed set of valid entries:
 *   1. Prefer entries that are not in recent-word history.
 * Returns `null` when nothing suitable is cached yet -- an empty/sparse
 * cache is an expected, normal state (e.g. the very first offline round
 * on a fresh install), not an error. The caller
 * (providers/indexeddb-cache-provider.ts) turns "null" into a
 * fall-through to tier 3.
 *
 * This function CAN reject: `getDb()` throws outside the browser, and
 * the IndexedDB read rejects when storage is unavailable. Tier 2 in
 * game/game-engine.ts catches both cases and falls through to tier 3.
 * Food/Medium was requested). Both are normal, expected states, not
 * errors. The caller (providers/indexeddb-cache-provider.ts) is what
 * turns "null" into a fall-through to tier 3 -- this function must never
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
  const pool = nonRecent.length > 0 ? nonRecent : matching;

  const entry = pool[Math.floor(Math.random() * pool.length)];
  rememberWordId(entry.id);

  return entry;
}
