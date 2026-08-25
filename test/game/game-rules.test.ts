import { describe, it, expect } from "vitest";
import {
  getImposterCount,
  isPlayerCountValid,
  isTripleThreatAvailable,
  getPlayerCountStatus,
  getPlayerCountMessage,
  validateGameConfig,
  validatePlayerName,
  MIN_PLAYERS,
  MAX_PLAYERS,
  MAX_PLAYER_NAME_LENGTH,
  GAME_MODE_RULES,
  DEFAULT_GAME_CONFIG,
} from "@/game/game-rules";
import type { GameMode, Player } from "@/game/game-types";

describe("getImposterCount", () => {
  it("returns 1 imposter for classic mode regardless of player count", () => {
    expect(getImposterCount(3, "classic")).toBe(1);
    expect(getImposterCount(12, "classic")).toBe(1);
  });

  it("returns 2 imposters for double mode", () => {
    expect(getImposterCount(5, "double")).toBe(2);
    expect(getImposterCount(12, "double")).toBe(2);
  });

  it("returns 3 imposters for triple mode", () => {
    expect(getImposterCount(7, "triple")).toBe(3);
    expect(getImposterCount(12, "triple")).toBe(3);
  });

  describe("random mode balancing", () => {
    it("assigns 1 imposter for 3-6 players", () => {
      expect(getImposterCount(3, "random")).toBe(1);
      expect(getImposterCount(6, "random")).toBe(1);
    });

    it("assigns 2 imposters for 7-9 players", () => {
      expect(getImposterCount(7, "random")).toBe(2);
      expect(getImposterCount(9, "random")).toBe(2);
    });

    it("assigns 3 imposters for 10-12 players", () => {
      expect(getImposterCount(10, "random")).toBe(3);
      expect(getImposterCount(12, "random")).toBe(3);
    });
  });

  // Explicit regression coverage for the example from the task brief:
  // 10 players / triple mode -> 3 imposters, 7 crew.
  it("10 players in triple mode yields 3 imposters and 7 crew", () => {
    const imposterCount = getImposterCount(10, "triple");
    expect(imposterCount).toBe(3);
    expect(10 - imposterCount).toBe(7);
  });
});

describe("isTripleThreatAvailable", () => {
  it("is unavailable below 7 players", () => {
    expect(isTripleThreatAvailable(6)).toBe(false);
  });

  it("is available at 7+ players", () => {
    expect(isTripleThreatAvailable(7)).toBe(true);
    expect(isTripleThreatAvailable(12)).toBe(true);
  });
});

describe("isPlayerCountValid / GAME_MODE_RULES", () => {
  it.each(Object.keys(GAME_MODE_RULES) as GameMode[])(
    "rejects a count below the minimum for %s",
    (mode) => {
      const { minPlayers } = GAME_MODE_RULES[mode];
      if (minPlayers > 0) {
        expect(isPlayerCountValid(mode, minPlayers - 1)).toBe(false);
      }
    },
  );

  it.each(Object.keys(GAME_MODE_RULES) as GameMode[])(
    "accepts the minimum and maximum bounds for %s",
    (mode) => {
      const { minPlayers, maxPlayers } = GAME_MODE_RULES[mode];
      expect(isPlayerCountValid(mode, minPlayers)).toBe(true);
      expect(isPlayerCountValid(mode, maxPlayers)).toBe(true);
    },
  );

  it("rejects a count above MAX_PLAYERS for every mode", () => {
    for (const mode of Object.keys(GAME_MODE_RULES) as GameMode[]) {
      expect(isPlayerCountValid(mode, MAX_PLAYERS + 1)).toBe(false);
    }
  });
});

describe("getPlayerCountStatus / getPlayerCountMessage", () => {
  it("is 'empty' at zero players", () => {
    expect(getPlayerCountStatus("classic", 0)).toBe("empty");
    expect(getPlayerCountMessage("classic", 0)).toMatch(/at least 3 players/i);
  });

  it("is 'too-few-overall' below MIN_PLAYERS", () => {
    expect(getPlayerCountStatus("classic", MIN_PLAYERS - 1)).toBe(
      "too-few-overall",
    );
  });

  it("is 'mode-requirement' when overall-valid but mode-invalid", () => {
    // Triple needs 7; 5 players clears the global minimum (3) but not
    // triple's own requirement.
    expect(getPlayerCountStatus("triple", 5)).toBe("mode-requirement");
    expect(getPlayerCountMessage("triple", 5)).toMatch(/triple threat needs/i);
  });

  it("is 'ready' once the mode's requirement is met", () => {
    expect(getPlayerCountStatus("classic", 3)).toBe("ready");
    expect(getPlayerCountMessage("classic", 3)).toMatch(/ready to play/i);
  });
});

describe("validateGameConfig", () => {
  it("accepts the default config", () => {
    expect(validateGameConfig(DEFAULT_GAME_CONFIG)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("rejects an invalid discussion timer duration", () => {
    const result = validateGameConfig({
      ...DEFAULT_GAME_CONFIG,
      options: {
        ...DEFAULT_GAME_CONFIG.options,
        discussionTimer: { enabled: true, duration: 999 },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/discussion timer/i);
  });

  it("rejects an invalid voting timer duration", () => {
    const result = validateGameConfig({
      ...DEFAULT_GAME_CONFIG,
      options: {
        ...DEFAULT_GAME_CONFIG.options,
        votingTimer: { enabled: true, duration: 999 },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/voting timer/i);
  });

  it("ignores an out-of-range timer duration when that timer is disabled", () => {
    const result = validateGameConfig({
      ...DEFAULT_GAME_CONFIG,
      options: {
        ...DEFAULT_GAME_CONFIG.options,
        discussionTimer: { enabled: false, duration: 999 },
      },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects an unknown difficulty", () => {
    const result = validateGameConfig({
      ...DEFAULT_GAME_CONFIG,
      // @ts-expect-error -- deliberately invalid for this test
      difficulty: "impossible",
    });
    expect(result.valid).toBe(false);
  });
});

describe("validatePlayerName", () => {
  const existing: Player[] = [
    { id: "p1", name: "Ahmed" },
    { id: "p2", name: "Asmed" },
  ];

  it("accepts a unique, trimmed name", () => {
    const result = validatePlayerName("  Mali  ", existing);
    expect(result).toEqual({ valid: true, value: "Mali" });
  });

  it("rejects an empty/whitespace-only name", () => {
    const result = validatePlayerName("   ", existing);
    expect(result.valid).toBe(false);
  });

  it("rejects a name longer than MAX_PLAYER_NAME_LENGTH", () => {
    const tooLong = "x".repeat(MAX_PLAYER_NAME_LENGTH + 1);
    const result = validatePlayerName(tooLong, existing);
    expect(result.valid).toBe(false);
  });

  it("rejects a case-insensitive duplicate name", () => {
    const result = validatePlayerName("ahmed", existing);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toMatch(/unique/i);
    }
  });

  it("allows editing a player's own name without flagging it as a duplicate", () => {
    const result = validatePlayerName("Ahmed", existing, "p1");
    expect(result.valid).toBe(true);
  });
});
