import { describe, it, expect, afterEach, vi } from "vitest";
import { getDb, cacheAiWord, getRandomCachedWord } from "@/lib/db";
import { resetGameData } from "@/lib/reset-game-data";
import { updateSettings, getSettings, DEFAULT_SETTINGS } from "@/lib/settings-store";
import { recordFinalResult, getStatistics } from "@/lib/game-statistics-store";
import { rememberWordId, getRecentWordIds } from "@/lib/recent-words";
import { storeRoundSession, getStoredRoundSession } from "@/lib/round-session-store";
import { baseSession } from "../helpers/fixtures";

afterEach(async () => {
  const db = getDb();
  await db.words.clear();
  await db.settings.clear();
});

describe("resetGameData", () => {
  it("clears cached AI words, settings, statistics, recent words, and the active round session", async () => {
    await cacheAiWord({ word: "Nebula", hint: "Space cloud.", category: "movies", difficulty: "hard" });
    await updateSettings({ sound: false });
    recordFinalResult(baseSession({ eliminatedPlayerIds: ["p1"] }), "crew-win");
    rememberWordId("some-id");
    storeRoundSession(baseSession({ status: "ready" }));

    await resetGameData();

    expect(await getRandomCachedWord("movies", "hard")).toBeNull();
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
    expect(getStatistics().gamesPlayed).toBe(0);
    expect(getRecentWordIds()).toEqual([]);
    expect(getStoredRoundSession()).toBeNull();
  });

  it("leaves the app fully playable immediately afterward (a new AI word can still be cached)", async () => {
    await resetGameData();
    await cacheAiWord({ word: "Taco", hint: "Folded dish.", category: "food", difficulty: "medium" });
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
});