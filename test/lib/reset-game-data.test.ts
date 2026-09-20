import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getDb,
  cacheAiWord,
  getRandomCachedWord,
  addCustomWord,
  getCustomWords,
} from "@/lib/db";
import { resetGameData } from "@/features/reset-game-data";
import {
  updateSettings,
  getSettings,
  DEFAULT_SETTINGS,
} from "@/entities/settings";
import { recordFinalResult, getGameHistory } from "@/entities/statistics";
import {
  processAchievementsForCompletedGame,
  getAchievementsSnapshot,
} from "@/lib/achievements/store";
import { rememberWordId, getRecentWordIds } from "@/lib/recent-words";
import {
  storeRoundSession,
  getStoredRoundSession,
} from "@/lib/round-session-store";
import { baseSession } from "../helpers/fixtures";

afterEach(async () => {
  const db = getDb();
  await db.words.clear();
  await db.settings.clear();
  await db.customWords.clear();
  await db.completedGames.clear();
  await db.achievementUnlocks.clear();
});

describe("resetGameData", () => {
  it("clears cached AI words, settings, statistics, recent words, saved custom words, and the active round session", async () => {
    await cacheAiWord({
      word: "Nebula",
      hint: "Space cloud.",
      category: "movies",
      difficulty: "hard",
    });
    await updateSettings({ sound: false });
    await recordFinalResult(
      baseSession({ eliminatedPlayerIds: ["p1"] }),
      "crew-win",
    );
    rememberWordId("some-id");
    storeRoundSession(baseSession({ status: "ready" }));
    await addCustomWord({
      word: "Biryani",
      category: "food",
      difficulty: "medium",
    });

    await resetGameData();

    expect(await getRandomCachedWord("movies", "hard")).toBeNull();
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
    expect(await getGameHistory()).toEqual([]);
    expect(getRecentWordIds()).toEqual([]);
    expect(getStoredRoundSession()).toBeNull();
    expect(await getCustomWords()).toEqual([]);
  });

  it("leaves the app fully playable immediately afterward (a new AI word can still be cached)", async () => {
    await resetGameData();
    await cacheAiWord({
      word: "Taco",
      hint: "Folded dish.",
      category: "food",
      difficulty: "medium",
    });
    const cached = await getRandomCachedWord("food", "medium");
    expect(cached?.word).toBe("Taco");
  });

  it("does not touch the static fallback word library", async () => {
    // lib/fallback-words.ts is a bundled constant, not persisted storage,
    // so there's nothing for resetGameData to clear -- this test simply
    // documents that a reset never needs to (and does not attempt to)
    // reach into that module.
    const { FALLBACK_WORDS } = await import("@/lib/fallback-words");
    const before = FALLBACK_WORDS.length;
    await resetGameData();
    expect(FALLBACK_WORDS.length).toBe(before);
  });

  it("concurrent calls share a single in-flight reset instead of clearing twice", async () => {
    const db = getDb();
    const clearSpy = vi.spyOn(db.words, "clear");

    await Promise.all([resetGameData(), resetGameData()]);

    expect(clearSpy).toHaveBeenCalledTimes(1);
    clearSpy.mockRestore();
  });

  it("clears achievement unlock history and returns achievement progress to locked/zero (spec section 16)", async () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    await recordFinalResult(session, "crew-win");
    const newlyUnlocked = await processAchievementsForCompletedGame(session);

    // Sanity: something was actually unlocked before the reset, or this
    // test would pass trivially.
    expect(newlyUnlocked.length).toBeGreaterThan(0);
    expect(await getDb().achievementUnlocks.count()).toBeGreaterThan(0);

    await resetGameData();

    expect(await getDb().achievementUnlocks.count()).toBe(0);
    const snapshotAfterReset = await getAchievementsSnapshot();
    expect(snapshotAfterReset.players).toHaveLength(0);
    expect(snapshotAfterReset.unlocksById.size).toBe(0);
  });

  it("does not leave any local player able to re-trigger an old unlock notification after reset", async () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    await recordFinalResult(session, "crew-win");
    await processAchievementsForCompletedGame(session);

    await resetGameData();

    // Playing the exact same game again after a reset must unlock
    // First Game fresh (it's a brand new history, not a duplicate of
    // the pre-reset one) -- proving no stale "already unlocked" record
    // survived the reset.
    await recordFinalResult(session, "crew-win");
    const newlyUnlocked = await processAchievementsForCompletedGame(session);
    expect(newlyUnlocked.map((e) => e.achievement.id)).toContain("first_game");
  });
});