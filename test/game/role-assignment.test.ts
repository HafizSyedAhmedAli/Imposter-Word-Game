// test/game/role-assignment.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { assignRoles } from "@/game/role-assignment";
import type { Player } from "@/game/game-types";

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
  }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("assignRoles", () => {
  it("assigns exactly imposterCount imposters and the rest crew", () => {
    const players = makePlayers(10);
    const roles = assignRoles(players, 3);

    expect(roles).toHaveLength(10);
    expect(roles.filter((r) => r.role === "imposter")).toHaveLength(3);
    expect(roles.filter((r) => r.role === "player")).toHaveLength(7);
  });

  it("every imposter is actually a member of the player list", () => {
    const players = makePlayers(8);
    const roles = assignRoles(players, 2);
    const playerIds = new Set(players.map((p) => p.id));

    for (const role of roles.filter((r) => r.role === "imposter")) {
      expect(playerIds.has(role.playerId)).toBe(true);
    }
  });

  it("no player receives more than one role entry", () => {
    const players = makePlayers(9);
    const roles = assignRoles(players, 2);
    const ids = roles.map((r) => r.playerId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("preserves the original player order in the output", () => {
    const players = makePlayers(6);
    const roles = assignRoles(players, 1);
    expect(roles.map((r) => r.playerId)).toEqual(players.map((p) => p.id));
  });

  it("supports the minimum imposter count (classic, 1 imposter)", () => {
    const players = makePlayers(3);
    const roles = assignRoles(players, 1);
    expect(roles.filter((r) => r.role === "imposter")).toHaveLength(1);
  });

  it("supports triple threat's maximum imposter count", () => {
    const players = makePlayers(12);
    const roles = assignRoles(players, 3);
    expect(roles.filter((r) => r.role === "imposter")).toHaveLength(3);
  });

  it("throws for a negative imposter count", () => {
    const players = makePlayers(5);
    expect(() => assignRoles(players, -1)).toThrow(/invalid imposter count/i);
  });

  it("throws when imposterCount exceeds the player list length", () => {
    const players = makePlayers(5);
    expect(() => assignRoles(players, 6)).toThrow(/invalid imposter count/i);
  });

  it("allows imposterCount === players.length (every player is an imposter)", () => {
    // The function itself only rejects imposterCount > players.length;
    // the game engine separately enforces imposterCount < players.length
    // before a round can start (see game/game-engine.ts). This test
    // documents role-assignment's own, more permissive contract rather
    // than assuming the engine's stricter rule lives here too.
    const players = makePlayers(3);
    const roles = assignRoles(players, 3);
    expect(roles.every((r) => r.role === "imposter")).toBe(true);
  });

  it("selection is unbiased across players (statistical smoke test)", () => {
    // Not a proof of uniformity, but guards against an obviously biased
    // implementation (e.g. always picking index 0..N).
    const players = makePlayers(4);
    const counts = new Map<string, number>(players.map((p) => [p.id, 0]));
    const RUNS = 400;

    for (let i = 0; i < RUNS; i++) {
      const roles = assignRoles(players, 1);
      const imposter = roles.find((r) => r.role === "imposter")!;
      counts.set(imposter.playerId, (counts.get(imposter.playerId) ?? 0) + 1);
    }

    for (const count of counts.values()) {
      // Expected ~100 per player out of 400 runs; allow a wide band to
      // keep this test non-flaky while still catching a badly biased
      // shuffle (e.g. one player never or always selected).
      expect(count).toBeGreaterThan(30);
      expect(count).toBeLessThan(200);
    }
  });

  it("is deterministic when Math.random is mocked", () => {
    const players = makePlayers(4);
    vi.spyOn(Math, "random").mockReturnValue(0);

    const first = assignRoles(players, 1);
    const second = assignRoles(players, 1);

    expect(first).toEqual(second);
  });
});
