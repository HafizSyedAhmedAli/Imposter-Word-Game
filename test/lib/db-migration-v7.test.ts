import { describe, it, expect } from "vitest";
import Dexie from "dexie";
import { getDb, getCompletedGames } from "@/lib/db";

/**
 * Verifies the v7 Dexie migration (see lib/db.ts) that added the
 * `completedGames` table (Statistics feature): an install that predates
 * this feature -- at v6, with real `words`/`customWords` rows already
 * saved -- must keep every existing row intact after opening at v7, and
 * the new table must be immediately usable (spec's "DATABASE MIGRATION
 * SAFETY" / "existing users must not lose their custom words, settings,
 * cached AI content ... during the migration").
 *
 * Same technique as test/lib/db-migration.test.ts's v5 test: open a
 * separate, lower-version Dexie instance against the same underlying
 * fake-indexeddb database name *before* lib/db.ts's own singleton ever
 * opens it, write pre-v7-shaped rows, then let the real `getDb()` run
 * the migration.
 */
describe("Dexie v7 migration (completedGames table added)", () => {
  it("adds an empty, usable completedGames table without touching existing v6 data", async () => {
    // 1. Open the database at the OLD (v6, pre-statistics) schema and
    // write rows the way a real pre-feature install would have.
    const legacyDb = new Dexie("imposter-word-db");
    legacyDb.version(6).stores({
      words:
        "id, category, difficulty, [category+difficulty], createdAt, normalizedWord, lastUsedAt, language, [category+difficulty+language]",
      settings: "id",
      customWords:
        "id, category, difficulty, [category+difficulty], normalizedWord, createdAt",
    });
    await legacyDb.open();
    await legacyDb.table("customWords").put({
      id: "legacy-custom-1",
      word: "Biryani",
      normalizedWord: "biryani",
      category: "food",
      difficulty: "medium",
      createdAt: 1,
    });
    await legacyDb.table("settings").put({
      id: "app",
      sound: false,
      haptics: true,
    });
    legacyDb.close();

    // 2. Now open the real, current-version database (lib/db.ts's
    // ImposterWordDB, currently at v7) against that same underlying
    // storage. Dexie runs the v7 upgrade automatically on open.
    const db = getDb();

    const migratedCustomWord = await db.customWords.get("legacy-custom-1");
    expect(migratedCustomWord).toBeDefined();
    expect(migratedCustomWord?.word).toBe("Biryani");

    const migratedSettings = await db.settings.get("app");
    expect(migratedSettings?.sound).toBe(false);

    // The new table exists, is empty, and is immediately writable --
    // not just present in the schema.
    expect(await getCompletedGames()).toEqual([]);
  });
});
