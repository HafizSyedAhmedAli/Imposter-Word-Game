import { describe, it, expect } from "vitest";
import {
  getStatistics,
  recordFinalResult,
  resetStatistics,
} from "@/lib/game-statistics-store";
import { baseSession, multiImposterSession } from "../helpers/fixtures";

describe("getStatistics", () => {
  it("starts at zero for every field", () => {
    expect(getStatistics()).toEqual({
      gamesPlayed: 0,
      crewWins: 0,
      imposterWins: 0,
      impostersCaught: 0,
      totalImpostersRevealed: 0,
    });
  });
});

describe("recordFinalResult", () => {
  it("increments gamesPlayed and crewWins for a crew-win", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    const stats = recordFinalResult(session, "crew-win");
    expect(stats.gamesPlayed).toBe(1);
    expect(stats.crewWins).toBe(1);
    expect(stats.imposterWins).toBe(0);
    expect(stats.impostersCaught).toBe(1);
    expect(stats.totalImpostersRevealed).toBe(1);
  });

  it("increments imposterWins for an imposter-win", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p2", "p3"] });
    const stats = recordFinalResult(session, "imposter-win");
    expect(stats.imposterWins).toBe(1);
    expect(stats.crewWins).toBe(0);
    expect(stats.impostersCaught).toBe(0);
  });

  it("counts every imposter caught in a multi-imposter game", () => {
    const session = multiImposterSession({ eliminatedPlayerIds: ["p1", "p2"] });
    const stats = recordFinalResult(session, "crew-win");
    expect(stats.impostersCaught).toBe(2);
    expect(stats.totalImpostersRevealed).toBe(2);
  });

  it("is idempotent per session id -- a refresh does not double-count", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    recordFinalResult(session, "crew-win");
    const stats = recordFinalResult(session, "crew-win");
    expect(stats.gamesPlayed).toBe(1);
  });

  it("accumulates across multiple distinct games", () => {
    const first = baseSession({ id: "game-1", eliminatedPlayerIds: ["p1"] });
    const second = baseSession({ id: "game-2", eliminatedPlayerIds: ["p2", "p3"] });
    recordFinalResult(first, "crew-win");
    const stats = recordFinalResult(second, "imposter-win");
    expect(stats.gamesPlayed).toBe(2);
    expect(stats.crewWins).toBe(1);
    expect(stats.imposterWins).toBe(1);
  });
});

describe("resetStatistics", () => {
  it("clears accumulated statistics back to zero", () => {
    recordFinalResult(baseSession({ eliminatedPlayerIds: ["p1"] }), "crew-win");
    resetStatistics();
    expect(getStatistics().gamesPlayed).toBe(0);
  });

  it("allows a previously-finalized round id to be recorded again after reset", () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    recordFinalResult(session, "crew-win");
    resetStatistics();
    const stats = recordFinalResult(session, "crew-win");
    expect(stats.gamesPlayed).toBe(1);
  });
});