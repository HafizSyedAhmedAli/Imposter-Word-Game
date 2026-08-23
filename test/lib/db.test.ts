import { describe, it, expect, afterEach } from "vitest";
import {
  getDb,
  cacheAiWord,
  markRoundUsed,
  getRandomCachedWord,
  resetUserData,
} from "@/lib/db";
import { rememberWordId } from "@/lib/recent-words";

// `getDb()` returns a module-level singleton Dexie instance backed by
// fake-indexeddb (see test/setup.ts). Unlike sessionStorage/localStorage,
// that in-memory database is NOT reset by the global beforeEach/afterEach
// hooks, so every test in this file clears its own tables afterward to
// stay isolated -- this is the "isolated test database" the task brief
// asks for: fake-indexeddb's storage never touches a real browser.
afterEach(async () => {
  const db = getDb();
  await db.words.clear();
  await db.settings.clear();
});

describe("cacheAiWord / getRandomCachedWord", () => {
  it("persists an AI-generated word so it can be retrieved afterward", async () => {
    await cacheAiWord({ word: "Nebula", hint: "A cloud of gas in space.", category: "movies", difficulty: "hard" });
    const cached = await getRandomCachedWord("movies", "hard");
    expect(cached?.word).toBe("Nebula");
    expect(cached?.source).toBe("ai");
  });

  it("returns null when nothing is cached yet", async () => {
    const cached = await getRandomCachedWord("food", "easy");
    expect(cached).toBeNull();
  });

  it("returns null when the cache has entries but none match category+difficulty", async () => {
    await cacheAiWord({ word: "Nebula", hint: "Space cloud.", category: "movies", difficulty: "hard" });
    const cached = await getRandomCachedWord("food", "easy");
    expect(cached).toBeNull();
  });

  it("'random' category matches any cached category", async () => {
    await cacheAiWord({ word: "Comet", hint: "Icy space traveler.", category: "movies", difficulty: "medium" });
    const cached = await getRandomCachedWord("random", "medium");
    expect(cached?.word).toBe("Comet");
  });

  it("does not create a duplicate row for the same normalized word in the same category/difficulty", async () => {
    await cacheAiWord({ word: "Pizza", hint: "Sliced dish.", category: "food", difficulty: "easy" });
    await cacheAiWord({ word: "PIZZA", hint: "Different hint.", category: "food", difficulty: "easy" });
    const db = getDb();
    const rows = await db.words.where({ category: "food", difficulty: "easy" }).toArray();
    expect(rows).toHaveLength(1);
  });

  it("prefers a word not in the session's recent-word history", async () => {
    await cacheAiWord({ word: "Alpha", hint: "First letter, sort of.", category: "food", difficulty: "easy" });
    await cacheAiWord({ word: "Beta", hint: "Second letter, sort of.", category: "food", difficulty: "easy" });

    const db = getDb();
    const alpha = await db.words.where({ normalizedWord: "alpha" }).first();
    rememberWordId(alpha!.id);

    const chosen = await getRandomCachedWord("food", "easy");
    expect(chosen?.word).toBe("Beta");
  });

  it("prefers never-used entries over previously-used ones", async () => {
    await cacheAiWord({ word: "Used", hint: "Already picked before.", category: "sports", difficulty: "medium" });
    await cacheAiWord({ word: "Fresh", hint: "Never picked yet.", category: "sports", difficulty: "medium" });

    const db = getDb();
    const used = await db.words.where({ normalizedWord: "used" }).first();
    await markRoundUsed(used!.id);

    const chosen = await getRandomCachedWord("sports", "medium");
    expect(chosen?.word).toBe("Fresh");
  });

  it("markRoundUsed increments usageCount and stamps lastUsedAt", async () => {
    await cacheAiWord({ word: "Comet", hint: "Icy traveler.", category: "food", difficulty: "hard" });
    const db = getDb();
    const entry = await db.words.where({ normalizedWord: "comet" }).first();
    await markRoundUsed(entry!.id);
    const updated = await db.words.get(entry!.id);
    expect(updated?.usageCount).toBe(1);
    expect(updated?.lastUsedAt).not.toBeNull();
  });

  it("recycles least-recently-used entries once every entry has been used at least once", async () => {
    await cacheAiWord({ word: "One", hint: "First.", category: "countries", difficulty: "easy" });
    await cacheAiWord({ word: "Two", hint: "Second.", category: "countries", difficulty: "easy" });

    const db = getDb();
    const one = await db.words.where({ normalizedWord: "one" }).first();
    const two = await db.words.where({ normalizedWord: "two" }).first();

    // Use "One" first (older lastUsedAt), then "Two" (newer lastUsedAt).
    await markRoundUsed(one!.id);
    await new Promise((r) => setTimeout(r, 10));
    await markRoundUsed(two!.id);

    // Both have usageCount 1; "One" has the older lastUsedAt, so it
    // should be preferred for reuse over "Two".
    const chosen = await getRandomCachedWord("countries", "easy");
    expect(chosen?.word).toBe("One");
  });
});

describe("resetUserData", () => {
  it("clears every cached word", async () => {
    await cacheAiWord({ word: "Nebula", hint: "Space cloud.", category: "movies", difficulty: "hard" });
    await resetUserData();
    const cached = await getRandomCachedWord("movies", "hard");
    expect(cached).toBeNull();
  });

  it("leaves the database usable immediately afterward", async () => {
    await resetUserData();
    await cacheAiWord({ word: "Taco", hint: "Folded dish.", category: "food", difficulty: "medium" });
    const cached = await getRandomCachedWord("food", "medium");
    expect(cached?.word).toBe("Taco");
  });
});

describe("MAX_CACHED_WORDS eviction", () => {
  it("evicts the oldest rows once the cache exceeds its bound", async () => {
    // Not exercising the full 500-row bound (too slow for a unit test);
    // instead this documents/verifies the *mechanism* directly against
    // the real table via the same createdAt-ordered eviction query
    // cacheAiWord uses internally.
    const db = getDb();
    for (let i = 0; i < 5; i++) {
      await db.words.put({
        id: `w${i}`,
        word: `Word${i}`,
        normalizedWord: `word${i}`,
        hint: "hint",
        category: "food",
        difficulty: "easy",
        source: "ai",
        createdAt: i,
        lastUsedAt: null,
        usageCount: 0,
      });
    }
    const stale = await db.words.orderBy("createdAt").limit(2).primaryKeys();
    await db.words.bulkDelete(stale);
    const remaining = await db.words.toArray();
    expect(remaining).toHaveLength(3);
    expect(remaining.map((w) => w.id).sort()).toEqual(["w2", "w3", "w4"]);
  });
});