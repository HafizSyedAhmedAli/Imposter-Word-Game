import { describe, it, expect } from "vitest";
import Dexie from "dexie";
import { getDb, getRandomCachedWord } from "@/lib/db";

/**
 * Verifies the v5 Dexie migration (see lib/db.ts) that added `language`
 * to the `words` table: existing rows written before Roman Urdu support
 * existed must survive the upgrade untouched except for a backfilled
 * `language: "english"`, never wiped (spec: "DATABASE MIGRATION SAFETY").
 *
 * This is a dedicated file (rather than living in test/lib/db.test.ts)
 * specifically so it runs before anything else in this test file ever
 * calls `getDb()` -- `getDb()` is a lazy, module-level singleton, so the
 * very first call decides which version the real Dexie instance opens
 * at. Simulating "an install that predates this feature" means writing
 * a pre-v5-shaped row directly against a *separate*, lower-version Dexie
 * instance (mirroring the exact v4 schema from lib/db.ts) against the
 * same underlying (fake-indexeddb, per test/setup.ts) database name
 * *before* lib/db.ts's own singleton ever opens it.
 */
describe("Dexie v5 migration (language backfill)", () => {
  it('backfills language: "english" onto a pre-existing row without deleting it', async () => {
    // 1. Open the database at the OLD (v4, pre-language) schema and
    // write a row the way a real pre-feature install would have.
    const legacyDb = new Dexie("imposter-word-db");
    legacyDb.version(4).stores({
      words:
        "id, category, difficulty, [category+difficulty], createdAt, normalizedWord, lastUsedAt",
      settings: "id",
    });
    await legacyDb.open();
    await legacyDb.table("words").put({
      id: "legacy-1",
      word: "Pizza",
      normalizedWord: "pizza",
      hint: "A round dish often shared in slices.",
      category: "food",
      difficulty: "easy",
      source: "ai",
      createdAt: 1,
      lastUsedAt: null,
      usageCount: 0,
      // Deliberately no `language` field -- this is exactly what a row
      // saved before this feature existed looks like.
    });
    legacyDb.close();

    // 2. Now open the real, current-version database (lib/db.ts's
    // ImposterWordDB, currently at v5) against that same underlying
    // storage. Dexie runs every upgrade function between the stored
    // version and the current one automatically on open.
    const db = getDb();
    const migrated = await db.words.get("legacy-1");

    // Never wiped...
    expect(migrated).toBeDefined();
    expect(migrated?.word).toBe("Pizza");
    expect(migrated?.hint).toBe("A round dish often shared in slices.");
    // ...and backfilled to "english", the only language that could have
    // produced this row before the migration existed.
    expect(migrated?.language).toBe("english");

    // The migrated row is also immediately usable by ordinary
    // English-language lookups -- the migration doesn't just fix the
    // stored shape, it fixes it in a way the rest of the app can
    // actually use.
    const found = await getRandomCachedWord("food", "easy", "english");
    expect(found?.id).toBe("legacy-1");
  });
});
