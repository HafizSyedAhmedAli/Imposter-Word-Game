import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb, addCustomWord, deleteCustomWord } from "@/lib/db";
import { DEFAULT_GAME_CONFIG, CUSTOM_CATEGORY } from "@/game/game-rules";
import type { Player } from "@/game/game-types";
import { clearRecentWords } from "@/lib/recent-words";

const roundStartedMock = vi.fn();

vi.mock("@/lib/analytics", async () => {
  const actual = await vi.importActual<typeof import("@/lib/analytics")>(
    "@/lib/analytics",
  );
  return {
    ...actual,
    analytics: {
      ...actual.analytics,
      roundStarted: (...args: unknown[]) => roundStartedMock(...args),
    },
  };
});

const { prepareGameRound } = await import("@/game/game-engine");

const PLAYER_NAMES = ["Ahmed", "Asmed", "Mali", "Hafsa", "Bareera"];

function makePlayers(count: number): Player[] {
  return PLAYER_NAMES.slice(0, count).map((name, i) => ({
    id: `p${i + 1}`,
    name,
  }));
}

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    value,
    configurable: true,
  });
}

const CUSTOM_CONFIG = { ...DEFAULT_GAME_CONFIG, category: CUSTOM_CATEGORY };

beforeEach(() => {
  setOnline(true);
});

afterEach(async () => {
  const db = getDb();
  await db.words.clear();
  await db.settings.clear();
  await db.customWords.clear();
  clearRecentWords();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  roundStartedMock.mockClear();
  setOnline(true);
});

describe("prepareGameRound -- Custom Words category", () => {
  it("uses a saved custom word as the round's secret word, with contentSource 'custom'", async () => {
    setOnline(false); // deterministic: goes straight to the generic hint fallback
    await addCustomWord({
      word: "Biryani",
      category: "food",
      difficulty: "medium",
    });

    const session = await prepareGameRound(CUSTOM_CONFIG, makePlayers(5));

    expect(session.round.word).toBe("Biryani");
    expect(session.round.contentSource).toBe("custom");
    expect(roundStartedMock).toHaveBeenCalledExactlyOnceWith({
      source: "custom",
    });
  });

  it("still produces a normal, non-empty imposter hint that never simply restates the word", async () => {
    setOnline(false);
    await addCustomWord({
      word: "Biryani",
      category: "food",
      difficulty: "medium",
    });

    const session = await prepareGameRound(CUSTOM_CONFIG, makePlayers(5));

    expect(session.round.hint.length).toBeGreaterThan(0);
    expect(session.round.hint.toLowerCase()).not.toContain("biryani");
  });

  it("uses a fresh AI-generated hint for the custom word when online", async () => {
    await addCustomWord({
      word: "Biryani",
      category: "food",
      difficulty: "medium",
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hint: "A spiced rice dish." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const session = await prepareGameRound(CUSTOM_CONFIG, makePlayers(5));

    expect(session.round.word).toBe("Biryani");
    expect(session.round.hint).toBe("A spiced rice dish.");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/round/generate",
      expect.objectContaining({
        body: JSON.stringify({
          word: "Biryani",
          category: "food",
          difficulty: "medium",
          language: "english",
        }),
      }),
    );
  });

  it("still assigns roles normally -- exactly one imposter for a 5-player classic game", async () => {
    setOnline(false);
    await addCustomWord({
      word: "Biryani",
      category: "food",
      difficulty: "medium",
    });

    const session = await prepareGameRound(CUSTOM_CONFIG, makePlayers(5));

    const imposters = session.round.roles.filter((r) => r.role === "imposter");
    expect(imposters).toHaveLength(1);
  });

  it("falls back to the normal 3-tier pipeline when no custom words are saved", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ word: "Nebula", hint: "A cloud in space." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const session = await prepareGameRound(CUSTOM_CONFIG, makePlayers(5));

    // Never left the player stuck: the game started anyway.
    expect(session.round.word).toBe("Nebula");
    expect(session.round.contentSource).toBe("ai");
  });

  it("can select from multiple saved custom words", async () => {
    setOnline(false);
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
    for (let i = 0; i < 20; i++) {
      clearRecentWords();
      const session = await prepareGameRound(CUSTOM_CONFIG, makePlayers(5));
      seen.add(session.round.word);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("deleting a custom word after a round has started does not change that round's word/hint", async () => {
    setOnline(false);
    const added = await addCustomWord({
      word: "Biryani",
      category: "food",
      difficulty: "medium",
    });
    if (!added.ok) throw new Error("setup failed");

    const session = await prepareGameRound(CUSTOM_CONFIG, makePlayers(5));
    expect(session.round.word).toBe("Biryani");

    // Simulates the player opening Settings mid-game and deleting the
    // word their current round is already using.
    await deleteCustomWord(added.entry.id);

    // The already-returned RoundSession is a plain object -- nothing
    // re-reads the customWords table for it.
    expect(session.round.word).toBe("Biryani");
  });

  it("does not affect the normal 'random' category's own word selection", async () => {
    await addCustomWord({
      word: "ShouldNeverAppearHere",
      category: "food",
      difficulty: "medium",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const session = await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));

    expect(session.round.word).not.toBe("ShouldNeverAppearHere");
    expect(session.round.contentSource).not.toBe("custom");
  });
});
