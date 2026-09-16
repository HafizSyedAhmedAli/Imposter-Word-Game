import { describe, it, expect } from "vitest";
import {
  ACHIEVEMENTS,
  getAchievementById,
} from "@/lib/achievements/definitions";

describe("ACHIEVEMENTS definitions", () => {
  it("every achievement id is unique", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every achievement has complete, non-empty metadata", () => {
    for (const achievement of ACHIEVEMENTS) {
      expect(achievement.id.length).toBeGreaterThan(0);
      expect(achievement.title.length).toBeGreaterThan(0);
      expect(achievement.description.length).toBeGreaterThan(0);
      expect(achievement.icon).toBeDefined();
      expect(["getting-started", "crew", "imposter", "special"]).toContain(
        achievement.category,
      );
      expect(typeof achievement.binary).toBe("boolean");
      expect(typeof achievement.evaluate).toBe("function");
    }
  });

  it("has between 10 and 12 initial achievements (spec: ~10-12, not dozens)", () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(10);
    expect(ACHIEVEMENTS.length).toBeLessThanOrEqual(12);
  });

  it("getAchievementById finds a real achievement and returns undefined for an unknown id", () => {
    expect(getAchievementById("first_game")?.title).toBe("First Game");
    expect(getAchievementById("does_not_exist")).toBeUndefined();
  });
});
