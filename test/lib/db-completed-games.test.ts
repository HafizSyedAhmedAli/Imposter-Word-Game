import { describe, it, expect, afterEach } from "vitest";
import {
  getDb,
  recordCompletedGame,
  getCompletedGames,
  clearCompletedGames,
  type CompletedGameRecord,
} from "@/lib/db";

// Same isolation convention as test/lib/db.test.ts -- the singleton
// Dexie instance persists across tests within this file, so each test
// cleans up its own table afterward.
afterEach(async () => {
  const db = getDb();
  await db.completedGames.clear();
});

function record(
  overrides: Partial<CompletedGameRecord> = {},
): CompletedGameRecord {
  return {
    id: "game-1",
    completedAt: Date.now(),
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
    ],
    ...overrides,
  };
}

describe("recordCompletedGame / getCompletedGames", () => {
  it("persists a completed game so it can be retrieved afterward", async () => {
    await recordCompletedGame(record());
    const games = await getCompletedGames();
    expect(games).toHaveLength(1);
    expect(games[0].id).toBe("game-1");
  });

  it("returns an empty array when nothing has been recorded yet", async () => {
    expect(await getCompletedGames()).toEqual([]);
  });

  it("stores multiple distinct completed games and returns them oldest first", async () => {
    await recordCompletedGame(record({ id: "game-1", completedAt: 1 }));
    await recordCompletedGame(record({ id: "game-2", completedAt: 2 }));
    const games = await getCompletedGames();
    expect(games.map((g) => g.id)).toEqual(["game-1", "game-2"]);
  });

  it("is idempotent: recording the same id twice overwrites rather than duplicates", async () => {
    await recordCompletedGame(record({ id: "game-1", roundsPlayed: 1 }));
    await recordCompletedGame(record({ id: "game-1", roundsPlayed: 3 }));
    const games = await getCompletedGames();
    expect(games).toHaveLength(1);
    expect(games[0].roundsPlayed).toBe(3);
  });
});

describe("clearCompletedGames", () => {
  it("removes every stored completed game", async () => {
    await recordCompletedGame(record({ id: "game-1" }));
    await recordCompletedGame(record({ id: "game-2" }));
    await clearCompletedGames();
    expect(await getCompletedGames()).toEqual([]);
  });
});
