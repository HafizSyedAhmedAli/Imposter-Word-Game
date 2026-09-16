import { describe, it, expect } from "vitest";
import {
  computeGlobalStatistics,
  computePlayerStatistics,
  EMPTY_GLOBAL_STATISTICS,
} from "@/lib/statistics-aggregation";
import type { CompletedGameRecord } from "@/lib/db";

/**
 * Pure, no-IndexedDB tests for the "Statistics Aggregator" step -- see
 * lib/statistics-record.ts's doc comment for the full pipeline. Every
 * `CompletedGameRecord` here is constructed directly (not via
 * buildCompletedGameRecord) since this module only cares about
 * aggregating already-built rows, not how they were built.
 */

function game(
  overrides: Partial<CompletedGameRecord> = {},
): CompletedGameRecord {
  return {
    id: "game-1",
    completedAt: 1,
    playerCount: 4,
    imposterCount: 1,
    winner: "crew-win",
    roundsPlayed: 1,
    category: "food",
    difficulty: "medium",
    mode: "classic",
    impostersCaught: 1,
    players: [
      {
        playerId: "p1",
        name: "Ahmed",
        normalizedName: "ahmed",
        role: "imposter",
        eliminated: true,
        votesReceived: 3,
      },
      {
        playerId: "p2",
        name: "Asmed",
        normalizedName: "asmed",
        role: "player",
        eliminated: false,
        votesReceived: 0,
      },
    ],
    ...overrides,
  };
}

describe("computeGlobalStatistics", () => {
  it("returns the zero-state when there are no games -- never NaN/Infinity", () => {
    expect(computeGlobalStatistics([])).toEqual(EMPTY_GLOBAL_STATISTICS);
  });

  it("computes win counts and mathematically consistent win rates", () => {
    const games = [
      game({ id: "g1", winner: "crew-win" }),
      game({ id: "g2", winner: "crew-win" }),
      game({ id: "g3", winner: "imposter-win" }),
      game({ id: "g4", winner: "imposter-win" }),
    ];
    const stats = computeGlobalStatistics(games);
    expect(stats.gamesPlayed).toBe(4);
    expect(stats.crewWins).toBe(2);
    expect(stats.imposterWins).toBe(2);
    expect(stats.crewWinRate).toBe(50);
    expect(stats.imposterWinRate).toBe(50);
    // Every completed game has exactly one winner (see
    // game/results-flow.ts -- no draw outcome exists), so the two rates
    // always sum to 100.
    expect(stats.crewWinRate + stats.imposterWinRate).toBe(100);
  });

  it("sums gameplay totals and derives safe averages", () => {
    const games = [
      game({ id: "g1", roundsPlayed: 2, playerCount: 4, imposterCount: 1 }),
      game({ id: "g2", roundsPlayed: 4, playerCount: 6, imposterCount: 2 }),
    ];
    const stats = computeGlobalStatistics(games);
    expect(stats.totalRounds).toBe(6);
    expect(stats.averageRoundsPerGame).toBe(3);
    expect(stats.totalPlayersParticipated).toBe(10);
    expect(stats.averagePlayersPerGame).toBe(5);
    expect(stats.totalImpostersPlayed).toBe(3);
    expect(stats.totalImpostersCaught).toBe(2);
    // votesReceived summed across every player, every game.
    expect(stats.totalVotesCast).toBe(6);
  });

  it("finds the most-played category/difficulty/mode, first-seen breaking ties", () => {
    const games = [
      game({ id: "g1", category: "food", difficulty: "easy", mode: "classic" }),
      game({
        id: "g2",
        category: "movies",
        difficulty: "easy",
        mode: "double",
      }),
      game({ id: "g3", category: "food", difficulty: "hard", mode: "double" }),
    ];
    const stats = computeGlobalStatistics(games);
    expect(stats.mostPlayedCategory).toBe("food");
    expect(stats.mostPlayedDifficulty).toBe("easy");
    expect(stats.mostPlayedMode).toBe("double");
  });

  it("always reports zero for the not-yet-implemented guess counters", () => {
    const stats = computeGlobalStatistics([game()]);
    expect(stats.totalSuccessfulImposterGuesses).toBe(0);
    expect(stats.totalFailedImposterGuesses).toBe(0);
  });
});

describe("computePlayerStatistics", () => {
  it("returns an empty list for no games", () => {
    expect(computePlayerStatistics([])).toEqual([]);
  });

  it("groups the same local player across games by normalized name", () => {
    const games = [
      game({
        id: "g1",
        winner: "crew-win",
        players: [
          {
            playerId: "a1",
            name: "Ahmed",
            normalizedName: "ahmed",
            role: "imposter",
            eliminated: true,
            votesReceived: 2,
          },
        ],
      }),
      game({
        id: "g2",
        winner: "imposter-win",
        players: [
          {
            playerId: "a2",
            name: "  ahmed  ",
            normalizedName: "ahmed",
            role: "imposter",
            eliminated: false,
            votesReceived: 1,
          },
        ],
      }),
    ];
    const stats = computePlayerStatistics(games);
    expect(stats).toHaveLength(1);
    expect(stats[0].gamesPlayed).toBe(2);
    expect(stats[0].imposterGames).toBe(2);
    expect(stats[0].imposterWins).toBe(1);
    expect(stats[0].timesVotedOut).toBe(1);
    expect(stats[0].timesVotedFor).toBe(3);
    // Display name follows the most recent (last, chronologically) game.
    expect(stats[0].displayName).toBe("  ahmed  ");
  });

  it("computes crew/imposter win rate and catch rate safely, including zero denominators", () => {
    const games = [
      game({
        id: "g1",
        winner: "crew-win",
        players: [
          {
            playerId: "p1",
            name: "Mali",
            normalizedName: "mali",
            role: "player",
            eliminated: false,
            votesReceived: 0,
          },
        ],
      }),
    ];
    const [mali] = computePlayerStatistics(games);
    expect(mali.crewGames).toBe(1);
    expect(mali.imposterGames).toBe(0);
    expect(mali.crewWinRate).toBe(100);
    // No imposter games played -- must be a safe 0, not NaN.
    expect(mali.imposterWinRate).toBe(0);
    expect(mali.catchRate).toBe(0);
  });

  it("sorts players by games played, descending", () => {
    const games = [
      game({
        id: "g1",
        players: [
          {
            playerId: "p1",
            name: "Ahmed",
            normalizedName: "ahmed",
            role: "imposter",
            eliminated: true,
            votesReceived: 0,
          },
          {
            playerId: "p2",
            name: "Asmed",
            normalizedName: "asmed",
            role: "player",
            eliminated: false,
            votesReceived: 0,
          },
        ],
      }),
      game({
        id: "g2",
        players: [
          {
            playerId: "p3",
            name: "Asmed",
            normalizedName: "asmed",
            role: "player",
            eliminated: false,
            votesReceived: 0,
          },
        ],
      }),
    ];
    const stats = computePlayerStatistics(games);
    expect(stats[0].normalizedName).toBe("asmed");
    expect(stats[0].gamesPlayed).toBe(2);
    expect(stats[1].normalizedName).toBe("ahmed");
  });
});
