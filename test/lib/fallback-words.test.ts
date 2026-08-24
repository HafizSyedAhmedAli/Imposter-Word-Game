import { describe, it, expect } from "vitest";
import { FALLBACK_WORDS, getRandomFallbackWord } from "@/lib/fallback-words";
import { rememberWordId, getRecentWordIds } from "@/lib/recent-words";
import { CATEGORIES, DIFFICULTIES } from "@/game/game-rules";
import type { Category, Difficulty } from "@/game/game-types";

describe("FALLBACK_WORDS", () => {
  it("is a non-empty static list", () => {
    expect(FALLBACK_WORDS.length).toBeGreaterThan(0);
  });

  it("covers every real category x difficulty combination used by game-rules", () => {
    const realCategories = CATEGORIES.map((c) => c.id).filter(
      (id): id is Category => id !== "random" && id !== "more",
    );
    for (const category of realCategories) {
      for (const difficulty of DIFFICULTIES.map((d) => d.id)) {
        const hasEntry = FALLBACK_WORDS.some(
          (w) => w.category === category && w.difficulty === difficulty,
        );
        expect(
          hasEntry,
          `expected at least one fallback word for ${category}/${difficulty}`,
        ).toBe(true);
      }
    }
  });
});

describe("getRandomFallbackWord", () => {
  it("returns an entry matching the exact category and difficulty", () => {
    const entry = getRandomFallbackWord("food", "easy");
    expect(entry.category).toBe("food");
    expect(entry.difficulty).toBe("easy");
  });

  it("matches any category when 'random' is requested", () => {
    const entry = getRandomFallbackWord("random", "medium");
    expect(entry.difficulty).toBe("medium");
  });

  it("always returns a word and a hint (never fails -- static, non-empty pool)", () => {
    for (const difficulty of DIFFICULTIES.map((d) => d.id) as Difficulty[]) {
      const entry = getRandomFallbackWord("random", difficulty);
      expect(entry.word.length).toBeGreaterThan(0);
      expect(entry.hint.length).toBeGreaterThan(0);
    }
  });

  it("throws for a category/difficulty combination with no static entries", () => {
    expect(() =>
      getRandomFallbackWord("food", "impossible" as Difficulty),
    ).toThrow(/no fallback word available/i);
  });

  it("avoids a word marked recently-used when a non-recent alternative exists", () => {
    const pool = FALLBACK_WORDS.filter(
      (w) => w.category === "food" && w.difficulty === "easy",
    );
    // Mark every food/easy entry except the last as recently used, so the
    // function is forced to either pick the sole non-recent entry or (if
    // it ignored recency) any of them.
    for (const entry of pool.slice(0, -1)) {
      rememberWordId(entry.id);
    }
    const chosen = getRandomFallbackWord("food", "easy");
    expect(chosen.id).toBe(pool[pool.length - 1].id);
  });

  it("falls back to reusing a recent word rather than throwing when the pool is exhausted", () => {
    const pool = FALLBACK_WORDS.filter(
      (w) => w.category === "food" && w.difficulty === "easy",
    );
    for (const entry of pool) {
      rememberWordId(entry.id);
    }
    // Every candidate is "recent" -- must not throw or infinite loop;
    // must still return a valid entry from the matching pool.
    const chosen = getRandomFallbackWord("food", "easy");
    expect(pool.some((w) => w.id === chosen.id)).toBe(true);
  });

  it("records the chosen word id as recently used", () => {
    const before = getRecentWordIds();
    const chosen = getRandomFallbackWord("animals", "hard");
    const after = getRecentWordIds();
    expect(after).toContain(chosen.id);
    expect(after.length).toBeGreaterThanOrEqual(before.length);
  });
});
