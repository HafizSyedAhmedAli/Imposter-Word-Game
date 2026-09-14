import { describe, it, expect, afterEach } from "vitest";
import { getDb } from "@/lib/db";
import {
  recordFinalResult,
  getGameHistory,
  getStatisticsSnapshot,
  resetStatistics,
} from "@/lib/game-statistics-store";
import { baseSession, multiImposterSession } from "../helpers/fixtures";

// `getDb()` returns a module-level singleton Dexie instance backed by
// fake-indexeddb (see test/setup.ts) that is NOT reset by the global
// beforeEach/afterEach hooks -- clear the table this file touches after
// every test to stay isolated, same convention as test/lib/db.test.ts.
afterEach(async () => {
  const db = getDb();
  await db.completedGames.clear();
});

describe("recordFinalResult / getGameHistory", () => {
  it("stores a completed game, retrievable afterward", async () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    await recordFinalResult(session, "crew-win");

    const history = await getGameHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(session.id);
    expect(history[0].winner).toBe("crew-win");
  });

  it("stores multiple distinct completed games", async () => {
    await recordFinalResult(
      baseSession({ id: "game-1", eliminatedPlayerIds: ["p1"] }),
      "crew-win",
    );
    await recordFinalResult(
      baseSession({ id: "game-2", eliminatedPlayerIds: ["p2", "p3"] }),
      "imposter-win",
    );

    const history = await getGameHistory();
    expect(history).toHaveLength(2);
  });

  it("is idempotent per session id -- recording the same finished game twice never duplicates it", async () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    await recordFinalResult(session, "crew-win");
    await recordFinalResult(session, "crew-win");

    const history = await getGameHistory();
    expect(history).toHaveLength(1);
  });
});

describe("getStatisticsSnapshot", () => {
  it("returns the zero-state when nothing has been recorded", async () => {
    const snapshot = await getStatisticsSnapshot();
    expect(snapshot.global.gamesPlayed).toBe(0);
    expect(snapshot.global.crewWinRate).toBe(0);
    expect(snapshot.players).toEqual([]);
  });

  it("aggregates global and per-player statistics from every stored game", async () => {
    await recordFinalResult(
      baseSession({ id: "game-1", eliminatedPlayerIds: ["p1"] }),
      "crew-win",
    );
    await recordFinalResult(
      multiImposterSession({ id: "game-2", eliminatedPlayerIds: ["p1", "p2"] }),
      "crew-win",
    );

    const snapshot = await getStatisticsSnapshot();
    expect(snapshot.global.gamesPlayed).toBe(2);
    expect(snapshot.global.crewWins).toBe(2);
    expect(snapshot.global.crewWinRate).toBe(100);
    // "Ahmed" (p1) is an imposter in both fixtures.
    const ahmed = snapshot.players.find((p) => p.normalizedName === "ahmed");
    expect(ahmed?.gamesPlayed).toBe(2);
    expect(ahmed?.imposterGames).toBe(2);
  });
});

describe("resetStatistics", () => {
  it("clears every stored completed game", async () => {
    await recordFinalResult(
      baseSession({ eliminatedPlayerIds: ["p1"] }),
      "crew-win",
    );
    await resetStatistics();

    const history = await getGameHistory();
    expect(history).toHaveLength(0);
    expect((await getStatisticsSnapshot()).global.gamesPlayed).toBe(0);
  });

  it("allows a previously-recorded session id to be recorded again after reset", async () => {
    const session = baseSession({ eliminatedPlayerIds: ["p1"] });
    await recordFinalResult(session, "crew-win");
    await resetStatistics();
    await recordFinalResult(session, "crew-win");

    const history = await getGameHistory();
    expect(history).toHaveLength(1);
  });
});
