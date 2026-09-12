import { describe, it, expect, afterEach } from "vitest";
import {
  getDb,
  addCustomWord,
  getCustomWords,
  deleteCustomWord,
  getRandomCustomWord,
  updateCustomWordHint,
  clearCustomWords,
} from "@/lib/db";
import { clearRecentWords } from "@/lib/recent-words";

afterEach(async () => {
  const db = getDb();
  await db.customWords.clear();
  clearRecentWords();
});

describe("addCustomWord", () => {
  it("saves a new custom word with the given category and difficulty", async () => {
    const result = await addCustomWord({
      word: "Biryani",
      category: "food",
      difficulty: "medium",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry.word).toBe("Biryani");
    expect(result.entry.category).toBe("food");
    expect(result.entry.difficulty).toBe("medium");
    expect(result.entry.id).toBeTruthy();
    expect(result.entry.createdAt).toBeGreaterThan(0);
  });

  it("rejects an empty word and does not save it", async () => {
    const result = await addCustomWord({
      word: "",
      category: "food",
      difficulty: "easy",
    });
    expect(result.ok).toBe(false);
    expect(await getCustomWords()).toEqual([]);
  });

  it("rejects a whitespace-only word", async () => {
    const result = await addCustomWord({
      word: "   ",
      category: "food",
      difficulty: "easy",
    });
    expect(result.ok).toBe(false);
  });

  it("trims whitespace before saving", async () => {
    const result = await addCustomWord({
      word: "  Pizza  ",
      category: "food",
      difficulty: "easy",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.entry.word).toBe("Pizza");
  });

  it("rejects a case-insensitive duplicate across all saved words", async () => {
    await addCustomWord({
      word: "Pizza",
      category: "food",
      difficulty: "easy",
    });
    const duplicate = await addCustomWord({
      word: " PIZZA ",
      category: "food",
      difficulty: "hard",
    });
    expect(duplicate.ok).toBe(false);
    expect(await getCustomWords()).toHaveLength(1);
  });

  it("allows a different word after a rejected duplicate", async () => {
    await addCustomWord({
      word: "Pizza",
      category: "food",
      difficulty: "easy",
    });
    const other = await addCustomWord({
      word: "Pasta",
      category: "food",
      difficulty: "easy",
    });
    expect(other.ok).toBe(true);
    expect(await getCustomWords()).toHaveLength(2);
  });
});

describe("getCustomWords", () => {
  it("retrieves saved custom words, newest first", async () => {
    await addCustomWord({
      word: "First",
      category: "food",
      difficulty: "easy",
    });
    await addCustomWord({
      word: "Second",
      category: "food",
      difficulty: "easy",
    });

    const words = await getCustomWords();
    expect(words.map((w) => w.word)).toEqual(["Second", "First"]);
  });

  it("returns an empty array when nothing has been saved", async () => {
    expect(await getCustomWords()).toEqual([]);
  });
});

describe("deleteCustomWord", () => {
  it("removes the word from IndexedDB and the visible list", async () => {
    const added = await addCustomWord({
      word: "Biryani",
      category: "food",
      difficulty: "medium",
    });
    expect(added.ok).toBe(true);
    if (!added.ok) return;

    await deleteCustomWord(added.entry.id);

    expect(await getCustomWords()).toEqual([]);
  });

  it("does not affect other saved custom words", async () => {
    const a = await addCustomWord({
      word: "Alpha",
      category: "food",
      difficulty: "easy",
    });
    await addCustomWord({ word: "Beta", category: "food", difficulty: "easy" });
    if (!a.ok) return;

    await deleteCustomWord(a.entry.id);

    const remaining = await getCustomWords();
    expect(remaining.map((w) => w.word)).toEqual(["Beta"]);
  });
});

describe("getRandomCustomWord", () => {
  it("selects a saved custom word matching the requested difficulty", async () => {
    await addCustomWord({
      word: "Easy1",
      category: "food",
      difficulty: "easy",
    });
    await addCustomWord({
      word: "Hard1",
      category: "food",
      difficulty: "hard",
    });

    const picked = await getRandomCustomWord("hard");
    expect(picked?.word).toBe("Hard1");
  });

  it("falls back to any saved word when none match the requested difficulty", async () => {
    await addCustomWord({
      word: "OnlyHard",
      category: "food",
      difficulty: "hard",
    });

    const picked = await getRandomCustomWord("easy");
    expect(picked?.word).toBe("OnlyHard");
  });

  it("returns null when there are no saved custom words", async () => {
    expect(await getRandomCustomWord("medium")).toBeNull();
  });

  it("can select any of multiple saved custom words", async () => {
    await addCustomWord({
      word: "One",
      category: "food",
      difficulty: "medium",
    });
    await addCustomWord({
      word: "Two",
      category: "food",
      difficulty: "medium",
    });
    await addCustomWord({
      word: "Three",
      category: "food",
      difficulty: "medium",
    });

    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const picked = await getRandomCustomWord("medium");
      if (picked) seen.add(picked.word);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("a deleted custom word is never selected for a future game", async () => {
    const added = await addCustomWord({
      word: "Gone",
      category: "food",
      difficulty: "medium",
    });
    if (!added.ok) return;
    await deleteCustomWord(added.entry.id);

    for (let i = 0; i < 5; i++) {
      const picked = await getRandomCustomWord("medium");
      expect(picked?.word).not.toBe("Gone");
    }
  });
});

describe("updateCustomWordHint", () => {
  it("persists a resolved hint onto the saved entry", async () => {
    const added = await addCustomWord({
      word: "Biryani",
      category: "food",
      difficulty: "medium",
    });
    if (!added.ok) return;

    await updateCustomWordHint(
      added.entry.id,
      "A spiced rice dish.",
      "english",
    );

    const [saved] = await getCustomWords();
    expect(saved.hint).toBe("A spiced rice dish.");
    expect(saved.hintLanguage).toBe("english");
  });

  it("never throws, even for a non-existent id", async () => {
    await expect(
      updateCustomWordHint("does-not-exist", "hint", "english"),
    ).resolves.not.toThrow();
  });
});

describe("clearCustomWords", () => {
  it("removes every saved custom word", async () => {
    await addCustomWord({ word: "One", category: "food", difficulty: "easy" });
    await addCustomWord({
      word: "Two",
      category: "sports",
      difficulty: "hard",
    });

    await clearCustomWords();

    expect(await getCustomWords()).toEqual([]);
  });
});

describe("custom words persistence", () => {
  it("persists across separate reads (survives a fresh query, simulating reopening the app)", async () => {
    await addCustomWord({
      word: "Interstellar",
      category: "movies",
      difficulty: "hard",
    });

    // A fresh call to getDb()/getCustomWords() reads straight from
    // IndexedDB rather than any in-memory cache -- this is the same
    // guarantee page refresh/app restart relies on.
    const reread = await getCustomWords();
    expect(reread.map((w) => w.word)).toEqual(["Interstellar"]);
  });
});
