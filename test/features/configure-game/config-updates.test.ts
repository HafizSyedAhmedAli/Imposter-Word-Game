import { describe, it, expect } from "vitest";
import {
  withCategory,
  withCustomWordCategory,
  withDifficulty,
  withDiscussionTimer,
  withMode,
  withVotingTimer,
} from "@/features/configure-game";
import { CUSTOM_CATEGORY, DEFAULT_GAME_CONFIG } from "@/features/play-round";

describe("configure-game config updates", () => {
  it("withMode changes only the mode", () => {
    const next = withMode(DEFAULT_GAME_CONFIG, "double");
    expect(next).toEqual({ ...DEFAULT_GAME_CONFIG, mode: "double" });
  });

  it("withDifficulty changes only the difficulty", () => {
    const next = withDifficulty(DEFAULT_GAME_CONFIG, "hard");
    expect(next).toEqual({ ...DEFAULT_GAME_CONFIG, difficulty: "hard" });
  });

  it("withCategory sets the category and clears customWordCategory", () => {
    const custom = withCustomWordCategory(DEFAULT_GAME_CONFIG, "food");
    const next = withCategory(custom, "animals");
    expect(next.category).toBe("animals");
    expect(next.customWordCategory).toBeUndefined();
  });

  it("withCustomWordCategory sets CUSTOM_CATEGORY and the sub-category together", () => {
    const next = withCustomWordCategory(DEFAULT_GAME_CONFIG, "food");
    expect(next.category).toBe(CUSTOM_CATEGORY);
    expect(next.customWordCategory).toBe("food");
  });

  it("a stale customWordCategory never survives leaving Custom Words mode and coming back", () => {
    let config = withCustomWordCategory(DEFAULT_GAME_CONFIG, "food");
    config = withCategory(config, "sports");
    // Re-entering Custom Words with no specific category (the empty-state
    // path) goes through withCategory(CUSTOM_CATEGORY), not the setter above.
    config = withCategory(config, CUSTOM_CATEGORY);
    expect(config.category).toBe(CUSTOM_CATEGORY);
    expect(config.customWordCategory).toBeUndefined();
  });

  it("withDiscussionTimer merges a partial patch and leaves the voting timer alone", () => {
    const next = withDiscussionTimer(DEFAULT_GAME_CONFIG, { duration: 90 });
    expect(next.options.discussionTimer).toEqual({
      enabled: true,
      duration: 90,
    });
    expect(next.options.votingTimer).toEqual(
      DEFAULT_GAME_CONFIG.options.votingTimer,
    );
  });

  it("withVotingTimer merges a partial patch and leaves the discussion timer alone", () => {
    const next = withVotingTimer(DEFAULT_GAME_CONFIG, { enabled: false });
    expect(next.options.votingTimer).toEqual({ enabled: false, duration: 30 });
    expect(next.options.discussionTimer).toEqual(
      DEFAULT_GAME_CONFIG.options.discussionTimer,
    );
  });

  it("never mutates the config it was given", () => {
    const snapshot = structuredClone(DEFAULT_GAME_CONFIG);
    withMode(DEFAULT_GAME_CONFIG, "triple");
    withCategory(DEFAULT_GAME_CONFIG, "food");
    withCustomWordCategory(DEFAULT_GAME_CONFIG, "food");
    withDifficulty(DEFAULT_GAME_CONFIG, "easy");
    withDiscussionTimer(DEFAULT_GAME_CONFIG, { duration: 30 });
    withVotingTimer(DEFAULT_GAME_CONFIG, { duration: 15 });
    expect(DEFAULT_GAME_CONFIG).toEqual(snapshot);
  });
});
