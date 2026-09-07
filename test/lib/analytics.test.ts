import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the real posthog-js `capture()` so these tests never hit a real
// network call and can assert exactly what would have been sent -- this
// is the ONLY function lib/analytics.ts calls out to (see that file's
// module doc comment), so mocking it here is sufficient to cover every
// helper. `__loaded: true` mirrors what lib/posthog-provider.tsx's
// `posthog.init()` sets once it has actually run -- safeTrack checks
// this flag before calling capture() (see that function's doc comment),
// so it must be true here for these assertions to observe anything.
const trackMock = vi.fn();
vi.mock("posthog-js", () => ({
  default: {
    __loaded: true,
    capture: (...args: unknown[]) => trackMock(...args),
  },
}));

const { analytics, toRoundSource } = await import("@/lib/analytics");

afterEach(() => {
  trackMock.mockClear();
});

describe("toRoundSource -- maps the engine's RoundContentSource to the analytics vocabulary", () => {
  it("maps 'ai' to 'ai'", () => {
    expect(toRoundSource("ai")).toBe("ai");
  });

  it("maps 'cache' to 'cached-ai'", () => {
    expect(toRoundSource("cache")).toBe("cached-ai");
  });

  it("maps 'fallback' to 'builtin'", () => {
    expect(toRoundSource("fallback")).toBe("builtin");
  });
});

describe("analytics.gameStarted", () => {
  it("sends playerCount, mode, category, difficulty, roundSource, and offline", () => {
    analytics.gameStarted({
      playerCount: 5,
      mode: "classic",
      category: "food",
      difficulty: "easy",
      roundSource: "ai",
      offline: false,
    });

    expect(trackMock).toHaveBeenCalledWith("game_started", {
      playerCount: 5,
      mode: "classic",
      category: "food",
      difficulty: "easy",
      roundSource: "ai",
      offline: false,
    });
  });

  it("omits roundSource/offline entirely when not provided, rather than sending undefined", () => {
    analytics.gameStarted({
      playerCount: 4,
      mode: "double",
      category: "random",
      difficulty: "medium",
    });

    expect(trackMock).toHaveBeenCalledWith("game_started", {
      playerCount: 4,
      mode: "double",
      category: "random",
      difficulty: "medium",
    });
    const [, payload] = trackMock.mock.calls[0];
    expect(payload).not.toHaveProperty("roundSource");
    expect(payload).not.toHaveProperty("offline");
  });
});

describe("analytics.gameCompleted", () => {
  it("maps 'crew-win' to winner: 'crew'", () => {
    analytics.gameCompleted({
      playerCount: 6,
      mode: "classic",
      winner: "crew-win",
    });

    expect(trackMock).toHaveBeenCalledWith("game_completed", {
      playerCount: 6,
      mode: "classic",
      winner: "crew",
    });
  });

  it("maps 'imposter-win' to winner: 'imposters'", () => {
    analytics.gameCompleted({
      playerCount: 6,
      mode: "classic",
      winner: "imposter-win",
    });

    expect(trackMock).toHaveBeenCalledWith("game_completed", {
      playerCount: 6,
      mode: "classic",
      winner: "imposters",
    });
  });

  it("never sends durationSeconds when it isn't provided", () => {
    analytics.gameCompleted({
      playerCount: 6,
      mode: "classic",
      winner: "crew-win",
    });

    const [, payload] = trackMock.mock.calls[0];
    expect(payload).not.toHaveProperty("durationSeconds");
  });

  it("sends durationSeconds when explicitly provided", () => {
    analytics.gameCompleted({
      playerCount: 6,
      mode: "classic",
      winner: "crew-win",
      durationSeconds: 240,
    });

    const [, payload] = trackMock.mock.calls[0];
    expect(payload).toMatchObject({ durationSeconds: 240 });
  });
});

describe("analytics.gameAbandoned", () => {
  it("sends phase, playerCount, and mode when all are provided", () => {
    analytics.gameAbandoned({
      phase: "voting",
      playerCount: 5,
      mode: "triple",
    });

    expect(trackMock).toHaveBeenCalledWith("game_abandoned", {
      phase: "voting",
      playerCount: 5,
      mode: "triple",
    });
  });

  it("sends only phase when playerCount/mode are omitted (RoundPreparationScreen's optional-chained case)", () => {
    analytics.gameAbandoned({ phase: "round-ready" });

    expect(trackMock).toHaveBeenCalledWith("game_abandoned", {
      phase: "round-ready",
    });
  });
});

describe("analytics.modeSelected", () => {
  it("sends the selected mode", () => {
    analytics.modeSelected("random");
    expect(trackMock).toHaveBeenCalledWith("mode_selected", {
      mode: "random",
    });
  });
});

describe("analytics.roundStarted", () => {
  it("sends the resolved source", () => {
    analytics.roundStarted({ source: "cached-ai" });
    expect(trackMock).toHaveBeenCalledWith("round_started", {
      source: "cached-ai",
    });
  });
});

describe("analytics.roundCompleted", () => {
  it("sends source when provided", () => {
    analytics.roundCompleted({ source: "builtin" });
    expect(trackMock).toHaveBeenCalledWith("round_completed", {
      source: "builtin",
    });
  });

  it("sends no properties object when called with nothing", () => {
    analytics.roundCompleted();
    expect(trackMock).toHaveBeenCalledWith("round_completed", undefined);
  });
});

describe("analytics.imposterGuess", () => {
  it("sends only the correct/incorrect boolean -- never the word or guess itself", () => {
    analytics.imposterGuess({ correct: true });
    expect(trackMock).toHaveBeenCalledWith("imposter_guess", {
      correct: true,
    });

    const [, payload] = trackMock.mock.calls[0];
    expect(Object.keys(payload as object)).toEqual(["correct"]);
  });
});

describe("analytics.aiRoundGenerated / aiRoundFallback", () => {
  it("aiRoundGenerated sends no properties", () => {
    analytics.aiRoundGenerated();
    expect(trackMock).toHaveBeenCalledWith("ai_round_generated", undefined);
  });

  it("aiRoundFallback sends no properties (never the underlying error)", () => {
    analytics.aiRoundFallback();
    expect(trackMock).toHaveBeenCalledWith("ai_round_fallback", undefined);
  });
});

describe("analytics.pwaInstalled", () => {
  it("sends no properties", () => {
    analytics.pwaInstalled();
    expect(trackMock).toHaveBeenCalledWith("pwa_installed", undefined);
  });
});

describe("safeTrack -- never lets analytics break the caller", () => {
  it("swallows a synchronous error thrown by track() without throwing", () => {
    trackMock.mockImplementationOnce(() => {
      throw new Error("blocked by an extension");
    });

    expect(() =>
      analytics.gameStarted({
        playerCount: 3,
        mode: "classic",
        category: "food",
        difficulty: "easy",
      }),
    ).not.toThrow();
  });

  it("every public helper is a plain synchronous function (never `await`ed by callers, per spec)", () => {
    // Guards against a future regression where a helper accidentally
    // becomes async -- callers throughout the app intentionally never
    // await these (see e.g. RoundPreparationScreen's doc comment) so
    // analytics can never delay gameplay.
    expect(
      analytics.gameStarted({
        playerCount: 1,
        mode: "classic",
        category: "food",
        difficulty: "easy",
      }),
    ).toBeUndefined();
  });
});

describe("posthog not yet initialized (__loaded: false) -- e.g. no NEXT_PUBLIC_POSTHOG_KEY configured", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("suppresses every capture() call rather than letting posthog-js warn/throw", async () => {
    const notLoadedTrackMock = vi.fn();
    vi.doMock("posthog-js", () => ({
      default: {
        __loaded: false,
        capture: (...args: unknown[]) => notLoadedTrackMock(...args),
      },
    }));

    const { analytics: notLoadedAnalytics } = await import("@/lib/analytics");
    notLoadedAnalytics.gameStarted({
      playerCount: 5,
      mode: "classic",
      category: "food",
      difficulty: "easy",
    });

    expect(notLoadedTrackMock).not.toHaveBeenCalled();
  });
});

describe("NEXT_PUBLIC_ANALYTICS_ENABLED=false -- local dev opt-out", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_ENABLED", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("suppresses every track() call while explicitly disabled", async () => {
    const disabledTrackMock = vi.fn();
    vi.doMock("posthog-js", () => ({
      default: {
        __loaded: true,
        capture: (...args: unknown[]) => disabledTrackMock(...args),
      },
    }));

    const { analytics: disabledAnalytics } = await import("@/lib/analytics");
    disabledAnalytics.gameStarted({
      playerCount: 5,
      mode: "classic",
      category: "food",
      difficulty: "easy",
    });
    disabledAnalytics.pwaInstalled();

    expect(disabledTrackMock).not.toHaveBeenCalled();
  });
});
