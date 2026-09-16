import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getDb,
  recordAchievementUnlock,
  getAchievementUnlocks,
  getAchievementUnlocksForPlayer,
  clearAchievementUnlocks,
  type AchievementUnlockRecord,
} from "@/lib/db";

/**
 * Direct Dexie-layer coverage for the `achievementUnlocks` table's
 * wrapper functions (lib/db.ts), same convention as
 * test/lib/db-completed-games.test.ts. lib/achievements/store.test.ts
 * already exercises this table through the higher-level
 * processAchievementsForCompletedGame/resetAchievements flow -- this
 * file instead tests each db.ts export directly and in isolation,
 * including `getAchievementUnlocksForPlayer`, which has no other test
 * coverage anywhere in the suite.
 */

afterEach(async () => {
  const db = getDb();
  await db.achievementUnlocks.clear();
});

function unlock(
  overrides: Partial<AchievementUnlockRecord> = {},
): AchievementUnlockRecord {
  return {
    id: "ahmed::first_game",
    achievementId: "first_game",
    normalizedName: "ahmed",
    displayName: "Ahmed",
    unlockedAt: 1_000,
    ...overrides,
  };
}

describe("recordAchievementUnlock / getAchievementUnlocks", () => {
  it("persists a single unlock record, retrievable afterward", async () => {
    await recordAchievementUnlock(unlock());
    const all = await getAchievementUnlocks();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe("ahmed::first_game");
  });

  it("persists multiple distinct unlocks across players and achievements", async () => {
    await recordAchievementUnlock(unlock());
    await recordAchievementUnlock(
      unlock({
        id: "ahmed::party_starter",
        achievementId: "party_starter",
      }),
    );
    await recordAchievementUnlock(
      unlock({
        id: "ali::first_game",
        normalizedName: "ali",
        displayName: "Ali",
      }),
    );

    const all = await getAchievementUnlocks();
    expect(all).toHaveLength(3);
  });

  it("is idempotent per id -- recording the same unlock twice overwrites rather than duplicating", async () => {
    await recordAchievementUnlock(unlock({ unlockedAt: 1_000 }));
    await recordAchievementUnlock(unlock({ unlockedAt: 2_000 }));

    const all = await getAchievementUnlocks();
    expect(all).toHaveLength(1);
    // The overwrite wins -- the row reflects the second call, not the
    // first, confirming this is a real overwrite and not a silently
    // ignored duplicate write.
    expect(all[0].unlockedAt).toBe(2_000);
  });

  it("swallows a write failure instead of throwing (best-effort, matches its own doc comment)", async () => {
    const db = getDb();
    const putSpy = vi
      .spyOn(db.achievementUnlocks, "put")
      .mockRejectedValueOnce(new Error("simulated IndexedDB failure"));

    await expect(recordAchievementUnlock(unlock())).resolves.toBeUndefined();
    expect(await getAchievementUnlocks()).toEqual([]);

    putSpy.mockRestore();
  });
});

describe("getAchievementUnlocksForPlayer", () => {
  it("returns only the given player's unlock rows", async () => {
    await recordAchievementUnlock(unlock());
    await recordAchievementUnlock(
      unlock({
        id: "ahmed::party_starter",
        achievementId: "party_starter",
      }),
    );
    await recordAchievementUnlock(
      unlock({
        id: "ali::first_game",
        normalizedName: "ali",
        displayName: "Ali",
      }),
    );

    const ahmedUnlocks = await getAchievementUnlocksForPlayer("ahmed");
    expect(ahmedUnlocks).toHaveLength(2);
    expect(ahmedUnlocks.every((u) => u.normalizedName === "ahmed")).toBe(true);

    const aliUnlocks = await getAchievementUnlocksForPlayer("ali");
    expect(aliUnlocks).toHaveLength(1);
    expect(aliUnlocks[0].achievementId).toBe("first_game");
  });

  it("returns an empty array for a player with no recorded unlocks", async () => {
    await recordAchievementUnlock(unlock());
    expect(await getAchievementUnlocksForPlayer("nobody")).toEqual([]);
  });
});

describe("clearAchievementUnlocks", () => {
  it("removes every stored unlock, across every player", async () => {
    await recordAchievementUnlock(unlock());
    await recordAchievementUnlock(
      unlock({
        id: "ali::first_game",
        normalizedName: "ali",
        displayName: "Ali",
      }),
    );
    expect(await getAchievementUnlocks()).toHaveLength(2);

    await clearAchievementUnlocks();
    expect(await getAchievementUnlocks()).toEqual([]);
  });

  it("is safe to call when the table is already empty", async () => {
    await expect(clearAchievementUnlocks()).resolves.toBeUndefined();
    expect(await getAchievementUnlocks()).toEqual([]);
  });
});
