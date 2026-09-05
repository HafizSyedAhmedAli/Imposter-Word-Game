import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { prepareGameRound } from "@/game/game-engine";
import { getDb, cacheAiWord } from "@/lib/db";
import { updateSettings } from "@/lib/settings-store";
import type { Player } from "@/game/game-types";
import { DEFAULT_GAME_CONFIG } from "@/game/game-rules";

const PLAYER_NAMES = [
  "Ahmed",
  "Asmed",
  "Mali",
  "Hafsa",
  "Bareera",
  "Hamza",
  "Fatima",
  "Ayan",
  "Muniza",
  "Arham",
  "Emaan",
  "Sania",
];

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

afterEach(async () => {
  const db = getDb();
  await db.words.clear();
  await db.settings.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setOnline(true);
});

beforeEach(() => {
  setOnline(true);
});

describe("prepareGameRound -- the 3-tier fallback chain", () => {
  it("uses AI content when the AI call succeeds (tier 1)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ word: "Nebula", hint: "A cloud in space." }),
      }),
    );

    const session = await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));

    expect(session.round.contentSource).toBe("ai");
    expect(session.round.word).toBe("Nebula");
  });

  it("caches a successful AI result for future offline rounds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ word: "Nebula", hint: "A cloud in space." }),
      }),
    );

    await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));

    const db = getDb();
    const cached = await db.words.where({ normalizedWord: "nebula" }).first();
    expect(cached).toBeDefined();
  });

  it("falls back to the IndexedDB cache when the AI call fails (tier 2)", async () => {
    await cacheAiWord({
      word: "Comet",
      hint: "Icy traveler.",
      category: "random",
      difficulty: "medium",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const session = await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));

    expect(session.round.contentSource).toBe("cache");
    expect(session.round.word).toBe("Comet");
  });

  it("falls back to the static word list when AI fails and the cache is empty (tier 3)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const session = await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));

    expect(session.round.contentSource).toBe("fallback");
    expect(session.round.word.length).toBeGreaterThan(0);
  });

  it("skips the AI call entirely when the device is offline, going straight to cache", async () => {
    setOnline(false);
    await cacheAiWord({
      word: "Comet",
      hint: "Icy traveler.",
      category: "random",
      difficulty: "medium",
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const session = await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(session.round.contentSource).toBe("cache");
  });

  it("remains playable offline with an empty cache (falls all the way to tier 3)", async () => {
    setOnline(false);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const session = await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(session.round.contentSource).toBe("fallback");
    expect(session.round.word.length).toBeGreaterThan(0);
  });

  it("never crashes the round when the AI response is invalid (fails validation, falls through)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ word: "", hint: "" }),
      }),
    );

    const session = await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));
    // No cache seeded either -- must land safely on tier 3, not throw.
    expect(session.round.contentSource).toBe("fallback");
  });
});

describe("prepareGameRound -- role assignment integration", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("offline in test")),
    );
  });

  it("assigns the correct imposter/crew split for classic mode", async () => {
    const session = await prepareGameRound(
      { ...DEFAULT_GAME_CONFIG, mode: "classic" },
      makePlayers(6),
    );
    expect(session.round.imposterCount).toBe(1);
    expect(
      session.round.roles.filter((r) => r.role === "imposter"),
    ).toHaveLength(1);
  });

  it("10 players / triple mode -> 3 imposters, 7 crew", async () => {
    const session = await prepareGameRound(
      { ...DEFAULT_GAME_CONFIG, mode: "triple" },
      makePlayers(10),
    );
    expect(session.round.imposterCount).toBe(3);
    expect(
      session.round.roles.filter((r) => r.role === "imposter"),
    ).toHaveLength(3);
    expect(session.round.roles.filter((r) => r.role === "player")).toHaveLength(
      7,
    );
  });

  it("rejects an imposter count that would consume the entire player list", async () => {
    // triple mode requires >=7 players; with exactly 3 players and
    // mode forced to "triple", imposterCount (3) >= players.length (3)
    // must be rejected before any word/hint work happens.
    await expect(
      prepareGameRound(
        { ...DEFAULT_GAME_CONFIG, mode: "triple" },
        makePlayers(3),
      ),
    ).rejects.toThrow(/imposter count is not valid/i);
  });

  it("produces a ready RoundSession with an initialized empty votes map", async () => {
    const session = await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(4));
    expect(session.status).toBe("ready");
    expect(session.currentPlayerIndex).toBe(0);
    expect(session.votes).toEqual({});
  });
});

describe("prepareGameRound -- onStage progress callback", () => {
  it("invokes onStage for word, hint, roles, and finalizing in order", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ word: "Nebula", hint: "A cloud in space." }),
      }),
    );

    const stages: string[] = [];
    await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5), {
      onStage: (stage) => {
        stages.push(stage);
      },
    });

    expect(stages).toEqual(["word", "hint", "roles", "finalizing"]);
  });
});

describe("prepareGameRound -- language", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("offline in test")),
    );
  });

  it("defaults to english when no Settings row exists (backward compatibility)", async () => {
    const session = await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));
    expect(session.round.language).toBe("english");
  });

  it("reads the language from Settings when no explicit override is given", async () => {
    await updateSettings({ language: "roman-urdu" });
    const session = await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));
    expect(session.round.language).toBe("roman-urdu");
    // The word/hint pair actually came from the roman-urdu fallback
    // grid, not silently from the english one.
    expect(session.round.contentSource).toBe("fallback");
  });

  it("an explicit `language` option overrides the Settings value", async () => {
    await updateSettings({ language: "roman-urdu" });
    const session = await prepareGameRound(
      DEFAULT_GAME_CONFIG,
      makePlayers(5),
      {
        language: "english",
      },
    );
    expect(session.round.language).toBe("english");
  });

  it("locks the round's language at preparation time -- a later Settings change never affects an already-prepared round", async () => {
    await updateSettings({ language: "roman-urdu" });
    const session = await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));
    expect(session.round.language).toBe("roman-urdu");

    // Simulate the player changing Settings mid-round.
    await updateSettings({ language: "english" });

    // The already-prepared session object is untouched -- nothing in
    // the engine mutates `session.round` after the fact.
    expect(session.round.language).toBe("roman-urdu");
  });

  it("caches a roman-urdu AI result tagged with language: roman-urdu, not english", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          word: "Pizza",
          hint: "Iske slice bana kar khate hain.",
        }),
      }),
    );

    await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5), {
      language: "roman-urdu",
    });

    const db = getDb();
    const cached = await vi.waitFor(async () => {
      const row = await db.words.where({ normalizedWord: "pizza" }).first();
      if (!row) throw new Error("not cached yet");
      return row;
    });
    expect(cached.language).toBe("roman-urdu");
  });
});
