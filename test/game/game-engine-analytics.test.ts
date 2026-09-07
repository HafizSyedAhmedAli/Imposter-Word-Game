import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb, cacheAiWord } from "@/lib/db";
import { DEFAULT_GAME_CONFIG } from "@/game/game-rules";
import type { Player } from "@/game/game-types";

// Mocks the analytics wrapper itself (not posthog-js) -- this file is
// only concerned with WHICH analytics helper game-engine.ts calls and
// with what source, for each branch of the 3-tier chain.
// lib/analytics.test.ts separately covers what each helper actually
// sends to PostHog.
const roundStartedMock = vi.fn();
const aiRoundGeneratedMock = vi.fn();
const aiRoundFallbackMock = vi.fn();

vi.mock("@/lib/analytics", async () => {
  const actual = await vi.importActual<typeof import("@/lib/analytics")>(
    "@/lib/analytics",
  );
  return {
    ...actual,
    analytics: {
      ...actual.analytics,
      roundStarted: (...args: unknown[]) => roundStartedMock(...args),
      aiRoundGenerated: (...args: unknown[]) => aiRoundGeneratedMock(...args),
      aiRoundFallback: (...args: unknown[]) => aiRoundFallbackMock(...args),
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

beforeEach(() => {
  setOnline(true);
});

afterEach(async () => {
  const db = getDb();
  await db.words.clear();
  await db.settings.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  roundStartedMock.mockClear();
  aiRoundGeneratedMock.mockClear();
  aiRoundFallbackMock.mockClear();
  setOnline(true);
});

describe("game-engine analytics -- tier 1 (AI succeeds)", () => {
  it("fires ai_round_generated and round_started(source: 'ai'), never ai_round_fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ word: "Nebula", hint: "A cloud in space." }),
      }),
    );

    await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));

    expect(aiRoundGeneratedMock).toHaveBeenCalledTimes(1);
    expect(roundStartedMock).toHaveBeenCalledExactlyOnceWith({
      source: "ai",
    });
    expect(aiRoundFallbackMock).not.toHaveBeenCalled();
  });
});

describe("game-engine analytics -- tier 2 (AI fails, cache serves it)", () => {
  it("fires ai_round_fallback exactly once and round_started(source: 'cached-ai'), never ai_round_generated", async () => {
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

    await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));

    expect(aiRoundFallbackMock).toHaveBeenCalledTimes(1);
    expect(roundStartedMock).toHaveBeenCalledExactlyOnceWith({
      source: "cached-ai",
    });
    expect(aiRoundGeneratedMock).not.toHaveBeenCalled();
  });
});

describe("game-engine analytics -- tier 3 (AI fails, cache empty, static fallback serves it)", () => {
  it("fires ai_round_fallback exactly once and round_started(source: 'builtin')", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));

    expect(aiRoundFallbackMock).toHaveBeenCalledTimes(1);
    expect(roundStartedMock).toHaveBeenCalledExactlyOnceWith({
      source: "builtin",
    });
    expect(aiRoundGeneratedMock).not.toHaveBeenCalled();
  });
});

describe("game-engine analytics -- offline device", () => {
  it("fires ai_round_fallback exactly once when offline, even though AI was never actually attempted", async () => {
    setOnline(false);
    await cacheAiWord({
      word: "Comet",
      hint: "Icy traveler.",
      category: "random",
      difficulty: "medium",
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(aiRoundFallbackMock).toHaveBeenCalledTimes(1);
    expect(roundStartedMock).toHaveBeenCalledExactlyOnceWith({
      source: "cached-ai",
    });
  });
});

describe("game-engine analytics -- invalid AI response falls through like a failure", () => {
  it("still fires ai_round_fallback exactly once, not ai_round_generated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ word: "", hint: "" }),
      }),
    );

    await prepareGameRound(DEFAULT_GAME_CONFIG, makePlayers(5));

    expect(aiRoundGeneratedMock).not.toHaveBeenCalled();
    expect(aiRoundFallbackMock).toHaveBeenCalledTimes(1);
    expect(roundStartedMock).toHaveBeenCalledExactlyOnceWith({
      source: "builtin",
    });
  });
});
