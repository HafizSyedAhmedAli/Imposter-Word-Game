import { describe, it, expect } from "vitest";
import Dexie from "dexie";
import { getDb, getAchievementUnlocks, getCompletedGames } from "@/lib/db";

/**
 * Verifies the v8 Dexie migration (see lib/db.ts) that added the
 * `achievementUnlocks` table (Achievements feature): an install that
 * predates this feature -- at v7, with real `words`/`customWords`/
 * `completedGames` rows already saved -- must keep every existing row
 * intact after opening at v8, and the new table must be immediately
 * usable. Same technique as test/lib/db-migration-v7.test.ts.
 */
describe("Dexie v8 migration (achievementUnlocks table added)", () => {
  it("adds an empty, usable achievementUnlocks table without touching existing v7 data", async () => {
    // 1. Open the database at the OLD (v7, pre-achievements) schema and
    // write rows the way a real pre-feature install would have.
    const legacyDb = new Dexie("imposter-word-db");
    legacyDb.version(7).stores({
      words:
        "id, category, difficulty, [category+difficulty], createdAt, normalizedWord, lastUsedAt, language, [category+difficulty+language]",
      settings: "id",
      customWords:
        "id, category, difficulty, [category+difficulty], normalizedWord, createdAt",
      completedGames: "id, completedAt, [category+difficulty+mode]",
    });
    await legacyDb.open();
    await legacyDb.table("completedGames").put({
      id: "legacy-game-1",
      completedAt: 1,
      playerCount: 4,
      imposterCount: 1,
      winner: "crew-win",
      roundsPlayed: 1,
      category: "food",
      difficulty: "medium",
      mode: "classic",
      impostersCaught: 1,
      players: [
        {
          playerId: "p1",
          name: "Ahmed",
          normalizedName: "ahmed",
          role: "imposter",
          eliminated: true,
          votesReceived: 3,
        },
      ],
    });
    legacyDb.close();

    // 2. Now open the real, current-version database (lib/db.ts's
    // ImposterWordDB, currently at v8) against that same underlying
    // storage. Dexie runs the v8 upgrade automatically on open.
    const db = getDb();

    const migratedGames = await getCompletedGames();
    expect(migratedGames).toHaveLength(1);
    expect(migratedGames[0].id).toBe("legacy-game-1");

    // The new table exists, is empty, and is immediately writable --
    // not just present in the schema.
    expect(await getAchievementUnlocks()).toEqual([]);
    await db.achievementUnlocks.put({
      id: "ahmed::first_game",
      achievementId: "first_game",
      normalizedName: "ahmed",
      displayName: "Ahmed",
      unlockedAt: 1,
    });
    expect(await getAchievementUnlocks()).toHaveLength(1);
  });
});
