// lib/db.ts
import Dexie, { type Table } from "dexie";
import {
  ENGLISH,
  type Category,
  type Difficulty,
  type GameLanguage,
  type GameMode,
} from "@/game/game-types";
import { generateId } from "@/shared/lib/id";
import { captureError } from "./monitoring";
import { getShownWordIds, rememberWordId } from "./recent-words";
import type { CustomWordEntry } from "@/entities/custom-word";

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
 * (see entities/settings) since this app has no concept of multiple
 * local profiles. Kept in its own table rather than folded into `words`
 * so the two can evolve independently.
 */
export type SettingsRow = {
  id: string;
  sound: boolean;
  haptics: boolean;
  // Optional: rows saved before this feature existed won't have it --
  // getSettings() defaults it in, see entities/settings.
  music?: boolean;
  // Optional for the same reason as `music` above -- rows saved before
  // the Language setting existed won't have it. getSettings() defaults
  // it to English, never trusting an unrecognized stored value either.
  language?: string;
};

/**
 * NOTE: `CustomWordEntry` (and the custom-word CRUD/selection functions
 * further down) now live in `entities/custom-word` -- see
 * entities/README.md. This file still declares the `customWords` Dexie
 * table itself (schema versions + migrations below) since it's the one
 * place every table is defined, so it imports the row type from the
 * slice and re-exports it, along with the functions, as a temporary
 * bridge so existing `import { ... } from "@/lib/db"` call sites keep
 * working unchanged. Repoint each to `@/entities/custom-word` as it's
 * touched; these re-exports go away once none are left.
 */
export type {
  CustomWordEntry,
  AddCustomWordResult,
} from "@/entities/custom-word";
export {
  addCustomWord,
  getCustomWords,
  deleteCustomWord,
  updateCustomWordHint,
  getRandomCustomWord,
  clearCustomWords,
} from "@/entities/custom-word";

/**
 * One player's public, post-game result within a single completed game
 * (Statistics feature). Deliberately does NOT carry the round's secret
 * word/hint -- only what the Final Results screen already reveals to
 * everyone (see game/final-results-flow.ts's `getFinalPlayerResults`).
 * `playerId` is only unique *within* one game (see game/game-types.ts's
 * `Player.id`, a fresh `generateId()` per game) -- cross-game player
 * matching for lifetime per-player statistics is done by
 * `normalizedName`, never `playerId`.
 */
export type CompletedGamePlayerResult = {
  playerId: string;
  /** Trimmed display name, exactly as the player entered it that game. */
  name: string;
  /** `name.trim().toLowerCase()` -- the cross-game identity key. Two
   * games with "Ahmed" and "ahmed " are the same local player; two
   * games with "Ahmed" and "Ahmed R." are not. */
  normalizedName: string;
  role: "player" | "imposter";
  /** Whether this player was voted out at any point during the game. */
  eliminated: boolean;
  /** Total votes received across every voting round this game (summed
   * from `RoundSession.votingHistory`, never who-voted-for-whom). */
  votesReceived: number;
};

/**
 * One finished game's local, offline-only summary (Statistics feature).
 * Primary-keyed by `id` = the originating `RoundSession.id` -- the same
 * id that's stable for the lifetime of one game across every
 * `continueRound` call (see game/game-types.ts). This is what makes
 * recording a finished game naturally idempotent: writing the same
 * game's record twice (a refresh of the Final Results screen, React
 * Strict Mode's double-invoke) is a Dexie `put` against the same key,
 * which overwrites in place rather than creating a duplicate row -- see
 * `recordCompletedGame` below. No separate "already recorded" list is
 * needed as a result.
 *
 * Deliberately stores one row per completed game (not a running lifetime
 * counter) so per-player statistics, future achievements, and local
 * leaderboards can all be derived later from this same table without a
 * schema change -- see lib/statistics-aggregation.ts, which is the only
 * thing that turns these rows into the numbers the Statistics screen
 * shows.
 */
export type CompletedGameRecord = {
  id: string;
  /** Epoch ms this game was recorded (not when it started). */
  completedAt: number;
  playerCount: number;
  imposterCount: number;
  winner: "crew-win" | "imposter-win";
  /** `RoundSession.round.number` at the moment the game ended -- how
   * many discussion/voting cycles this one game went through. */
  roundsPlayed: number;
  category: Category;
  difficulty: Difficulty;
  mode: GameMode;
  /** How many of this game's imposters were ever voted out -- a
   * convenience field mirroring what `players` already encodes, kept
   * here (rather than recomputed on every aggregation pass) the same
   * way `WordEntry.normalizedWord` mirrors `word` for cheap lookups. */
  impostersCaught: number;
  players: CompletedGamePlayerResult[];
};

/**
 * One (local player, achievement) unlock -- the Achievements feature's
 * only persisted state. Every achievement *condition* is derived purely
 * from `completedGames` (see lib/achievements/engine.ts) -- this table
 * exists only to (a) remember the moment an achievement was first
 * earned (`unlockedAt`, shown on the Achievements screen) and (b) let
 * lib/achievements/store.ts tell which achievements are genuinely NEW
 * after a given game, so the unlock notification never re-fires for one
 * already earned. It is never the source of truth for whether an
 * achievement is unlocked -- the Achievements screen always recomputes
 * that live from `completedGames`, so a failed/missing write here can
 * never make an actually-earned achievement look locked.
 *
 * Primary-keyed by `id` = `${normalizedName}::${achievementId}` -- the
 * same "put is naturally idempotent" trick `CompletedGameRecord` uses
 * (see its doc comment): recording the same unlock twice overwrites the
 * same row instead of creating a duplicate, with no separate dedupe
 * bookkeeping required.
 */
export type AchievementUnlockRecord = {
  id: string;
  achievementId: string;
  /** Cross-game identity key -- same convention as
   * `CompletedGamePlayerResult.normalizedName` above. */
  normalizedName: string;
  /** Display name as of the moment this achievement unlocked. */
  displayName: string;
  unlockedAt: number;
};

class ImposterWordDB extends Dexie {
  words!: Table<WordEntry, string>;
  settings!: Table<SettingsRow, string>;
  customWords!: Table<CustomWordEntry, string>;
  completedGames!: Table<CompletedGameRecord, string>;
  achievementUnlocks!: Table<AchievementUnlockRecord, string>;

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
    // a default (see entities/settings), the same pattern already
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

    // v7: adds the `completedGames` table (Statistics feature). Purely
    // additive, same spirit as v4's `settings` and v6's `customWords`
    // tables -- every existing `words`/`settings`/`customWords` row is
    // completely untouched, and a new empty table needs no upgrade
    // function. Indexed on `completedAt` (history, oldest/newest first)
    // and `[category+difficulty+mode]` (the "Most Played" aggregates in
    // lib/statistics-aggregation.ts, so that pass doesn't need a full
    // table scan to group by them as the table grows).
    this.version(7).stores({
      words:
        "id, category, difficulty, [category+difficulty], createdAt, normalizedWord, lastUsedAt, language, [category+difficulty+language]",
      settings: "id",
      customWords:
        "id, category, difficulty, [category+difficulty], normalizedWord, createdAt",
      completedGames: "id, completedAt, [category+difficulty+mode]",
    });

    // v8: adds the `achievementUnlocks` table (Achievements feature).
    // Purely additive, same spirit as v4/v6/v7's new tables above --
    // every existing `words`/`settings`/`customWords`/`completedGames`
    // row is completely untouched, and a new empty table needs no
    // upgrade function. Indexed on `normalizedName` (so a player's own
    // unlock history can be read without a full-table scan) and
    // `[normalizedName+achievementId]` (the exact lookup
    // lib/achievements/store.ts needs to tell whether one specific
    // achievement is already unlocked for one specific player).
    this.version(8).stores({
      words:
        "id, category, difficulty, [category+difficulty], createdAt, normalizedWord, lastUsedAt, language, [category+difficulty+language]",
      settings: "id",
      customWords:
        "id, category, difficulty, [category+difficulty], normalizedWord, createdAt",
      completedGames: "id, completedAt, [category+difficulty+mode]",
      achievementUnlocks:
        "id, normalizedName, achievementId, unlockedAt, [normalizedName+achievementId]",
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
 *   0. Exclude every entry already shown this session
 *      (lib/recent-words.ts's uncapped `getShownWordIds` tracker) --
 *      if that leaves nothing, return `null` (exhaustion) rather than
 *      repeat one; the caller falls through to tier 3.
 *   1. Within what's left, prefer never-used entries
 *      (`usageCount === 0`), then the least-recently-used ones --
 *      spreads usage evenly across the cache over the lifetime of the
 *      install instead of always drawing from the same handful of rows.
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

  // Exhaustion check: if every matching row has already been shown this
  // session, there is nothing left to offer without repeating one --
  // signal that via `null` rather than quietly reusing a shown-word.
  // Deliberately uses the *uncapped* `getShownWordIds` tracker rather
  // than `getRecentWordIds` (which only remembers the last 10 words
  // across every category/difficulty combined) -- a category/difficulty
  // pool bigger than 10 must not silently "forget" its earlier entries
  // were already shown. See providers/indexeddb-cache-provider.ts, which
  // turns this null into a fall-through to the tier-3 static provider.
  const shownIds = new Set(getShownWordIds());
  const tier1 = matching.filter((w) => !shownIds.has(w.id));
  if (tier1.length === 0) return null;

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
/* Statistics (Home -> Statistics)                                       */
/*                                                                        */
/* CRUD for locally-stored completed-game summaries. This module never   */
/* decides who won or builds a record itself -- see                      */
/* lib/statistics-record.ts (pure record-building) and                   */
/* lib/statistics-aggregation.ts (pure aggregation into the numbers the  */
/* Statistics screen shows). This file only persists/reads/clears rows,  */
/* matching the words/settings/customWords functions above.              */
/* -------------------------------------------------------------------- */

/**
 * Saves one finished game's record. A plain Dexie `put` against the
 * primary key (`record.id` = the game's `RoundSession.id`) -- calling
 * this twice for the same finished game (a refreshed Final Results
 * screen) overwrites the same row with identical data rather than
 * creating a duplicate, so no separate dedupe bookkeeping is needed for
 * "a completed game must only be recorded once" (see
 * `CompletedGameRecord`'s doc comment above).
 *
 * Best-effort and silent, same reasoning as `cacheAiWord`: this always
 * runs after the round is already fully decided and the Final Results
 * screen is already showing that outcome to the players, so a failed
 * statistics write must never surface an error or retry loop on a
 * screen whose game is already over.
 */
export async function recordCompletedGame(
  record: CompletedGameRecord,
): Promise<void> {
  try {
    const db = getDb();
    await db.completedGames.put(record);
  } catch (error) {
    captureError(error, { phase: "record-completed-game" });
  }
}

/** Every locally-stored completed game, oldest first. */
export async function getCompletedGames(): Promise<CompletedGameRecord[]> {
  const db = getDb();
  return db.completedGames.orderBy("completedAt").toArray();
}

/**
 * Deletes every stored completed-game record -- the Statistics half of
 * "Reset Game Data" (see lib/reset-game-data.ts). Rethrows on failure,
 * same as `resetUserData`/`clearCustomWords` above: this is a
 * user-initiated action that must report success or failure, not fail
 * silently and leave stale statistics behind.
 */
export async function clearCompletedGames(): Promise<void> {
  const db = getDb();
  await db.completedGames.clear();
}

/* -------------------------------------------------------------------- */
/* Achievements (Home -> Achievements)                                   */
/*                                                                        */
/* CRUD for locally-stored achievement unlock records. Like the          */
/* Statistics section above, this module never decides whether an       */
/* achievement is earned -- see lib/achievements/engine.ts (pure         */
/* evaluation from `completedGames`) and lib/achievements/store.ts       */
/* (orchestrates evaluation + persists newly-earned unlocks). This file  */
/* only persists/reads/clears rows.                                      */
/* -------------------------------------------------------------------- */

/**
 * Saves one (player, achievement) unlock. A plain Dexie `put` against
 * the primary key (`record.id` = `${normalizedName}::${achievementId}`)
 * -- recording the same unlock twice is a no-op overwrite, same
 * reasoning as `recordCompletedGame` above.
 *
 * Best-effort and silent, same reasoning as `recordCompletedGame`: this
 * always runs after a game is already fully decided and (usually) after
 * the Final Results screen has already shown an unlock notification for
 * it -- a failed write must never surface an error on a screen whose
 * game is already over. Because achievement *state* is always
 * recomputed live from `completedGames` (see this table's doc comment
 * on `AchievementUnlockRecord`), a failed write here only means a
 * missing "unlocked on" timestamp and a possible repeat notification
 * next time -- never a real achievement silently failing to unlock.
 */
export async function recordAchievementUnlock(
  record: AchievementUnlockRecord,
): Promise<void> {
  try {
    const db = getDb();
    await db.achievementUnlocks.put(record);
  } catch (error) {
    captureError(error, { phase: "record-achievement-unlock" });
  }
}

/** Every locally-stored achievement unlock, across every local player. */
export async function getAchievementUnlocks(): Promise
  AchievementUnlockRecord[]
> {
  const db = getDb();
  return db.achievementUnlocks.toArray();
}

/** One local player's unlock history, keyed the same way
 * `computePlayerStatistics` groups players (trimmed, lowercased name). */
export async function getAchievementUnlocksForPlayer(
  normalizedName: string,
): Promise<AchievementUnlockRecord[]> {
  const db = getDb();
  return db.achievementUnlocks
    .where("normalizedName")
    .equals(normalizedName)
    .toArray();
}

/**
 * Deletes every stored achievement unlock -- the Achievements half of
 * "Reset Game Data" (see lib/reset-game-data.ts). Rethrows on failure,
 * same as `clearCompletedGames` above: a user-initiated reset must
 * report failure rather than silently leaving stale unlock history
 * (and stale "already notified" state) behind.
 */
export async function clearAchievementUnlocks(): Promise<void> {
  const db = getDb();
  await db.achievementUnlocks.clear();
}