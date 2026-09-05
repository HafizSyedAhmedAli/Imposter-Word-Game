import { describe, it, expect, afterEach } from "vitest";
import { getDb, cacheAiWord } from "@/lib/db";
import { IndexedDbCacheProvider } from "@/providers/indexeddb-cache-provider";
import { FallbackWordProvider } from "@/providers/fallback-word-provider";

afterEach(async () => {
  const db = getDb();
  await db.words.clear();
});

describe("IndexedDbCacheProvider (tier 2)", () => {
  const provider = new IndexedDbCacheProvider();

  it("returns a previously cached AI round with source 'cache'", async () => {
    await cacheAiWord({
      word: "Comet",
      hint: "Icy traveler.",
      category: "movies",
      difficulty: "medium",
    });
    const result = await provider.generateRoundContent("movies", "medium");
    expect(result).toEqual({
      word: "Comet",
      hint: "Icy traveler.",
      source: "cache",
      language: "english",
    });
  });

  it("returns a roman-urdu cached round when roman-urdu was requested, never an english one", async () => {
    await cacheAiWord({
      word: "Pizza",
      hint: "Iske slice bana kar khate hain.",
      category: "food",
      difficulty: "easy",
      language: "roman-urdu",
    });
    await cacheAiWord({
      word: "Burger",
      hint: "A common fast-food item.",
      category: "food",
      difficulty: "easy",
      language: "english",
    });

    const result = await provider.generateRoundContent("food", "easy", {
      language: "roman-urdu",
    });
    expect(result.language).toBe("roman-urdu");
    expect(result.word).toBe("Pizza");
  });

  it("throws when the cache has nothing suitable (empty cache)", async () => {
    await expect(provider.generateRoundContent("food", "easy")).rejects.toThrow(
      /no suitable cached round/i,
    );
  });

  it("throws when the cache has entries but none match category/difficulty", async () => {
    await cacheAiWord({
      word: "Comet",
      hint: "Icy traveler.",
      category: "movies",
      difficulty: "medium",
    });
    await expect(provider.generateRoundContent("food", "easy")).rejects.toThrow(
      /no suitable cached round/i,
    );
  });
});

describe("FallbackWordProvider (tier 3)", () => {
  const provider = new FallbackWordProvider();

  it("always resolves with a word/hint pair and source 'fallback'", async () => {
    const result = await provider.generateRoundContent("food", "easy");
    expect(result.source).toBe("fallback");
    expect(result.word.length).toBeGreaterThan(0);
    expect(result.hint.length).toBeGreaterThan(0);
  });

  it("never rejects for a supported category/difficulty combination", async () => {
    await expect(
      provider.generateRoundContent("random", "hard"),
    ).resolves.toBeDefined();
  });

  it("resolves with roman-urdu content, using latin letters only, when roman-urdu is requested", async () => {
    const result = await provider.generateRoundContent("food", "easy", {
      language: "roman-urdu",
    });
    expect(result.language).toBe("roman-urdu");
    expect(result.hint).not.toMatch(/[\u0600-\u06FF\u0900-\u097F]/);
  });
});
