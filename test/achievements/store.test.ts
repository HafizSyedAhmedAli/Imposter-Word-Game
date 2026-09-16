import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getDb, type CompletedGameRecord } from "@/lib/db";
import type { RoundSession } from "@/game/game-types";
import {
  processAchievementsForCompletedGame,
  getAchievementsSnapshot,
  resetAchievements,
} from "@/lib/achievements/store";

/**
 * Integration tests against the real Dexie database (fake-indexeddb in
 * this Vitest environment -- see test/setup.ts), exercising the same
 * "already-recorded completed game -> evaluate -> persist newly
 * unlocked -> dedupe on replay" path FinalResultsScreen.tsx drives in
 * production. Nothing here touches the network, matching spec section
 * 15 ("Achievements must work completely offline") -- IndexedDB is the
 * only storage involved anywhere in this path.
 */

async function seedCompletedGame(record: CompletedGameRecord) {
  await getDb().completedGames.put(record);
}

function sessionFor(players: { id: string; name: string }[]): RoundSession {
  // processAchievementsForCompletedGame only reads `session.players` --
  // every other RoundSession field is irrelevant to it, so a minimal
  // fixture is intentionally used here rather than a full round/config.
  return { players } as unknown as RoundSession;
}

const baseGame: CompletedGameRecord = {
  id: "g1",
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
      role: "player",
      eliminated: false,
      votesReceived: 0,
    },
  ],
};

beforeEach(async () => {
  const db = getDb();
  await db.completedGames.clear();
  await db.achievementUnlocks.clear();
});

afterEach(async () => {
  const db = getDb();
  await db.completedGames.clear();
  await db.achievementUnlocks.clear();
});

describe("processAchievementsForCompletedGame", () => {
  it("returns and persists a newly-unlocked achievement for a player's first game", async () => {
    await seedCompletedGame(baseGame);
    const session = sessionFor([{ id: "p1", name: "Ahmed" }]);

    const newlyUnlocked = await processAchievementsForCompletedGame(session);

    const ids = newlyUnlocked.map((e) => e.achievement.id);
    expect(ids).toContain("first_game");
    expect(ids).toContain("imposter_hunter"); // crew game, 1 imposter caught
    expect(newlyUnlocked.every((e) => e.normalizedName === "ahmed")).toBe(true);

    const stored = await getDb().achievementUnlocks.toArray();
    expect(stored.find((r) => r.id === "ahmed::first_game")).toBeDefined();
  });

  it("does not re-report an achievement already unlocked in an earlier game (no duplicate notifications)", async () => {
    await seedCompletedGame(baseGame);
    const session = sessionFor([{ id: "p1", name: "Ahmed" }]);

    const first = await processAchievementsForCompletedGame(session);
    expect(first.map((e) => e.achievement.id)).toContain("first_game");

    // A second completed game for the same player -- First Game/
    // Imposter Hunter are already unlocked and must not be reported
    // again, even though they'd still independently evaluate as
    // "unlocked" from the stats.
    await seedCompletedGame({ ...baseGame, id: "g2" });
    const second = await processAchievementsForCompletedGame(session);
    expect(second.map((e) => e.achievement.id)).not.toContain("first_game");
    expect(second.map((e) => e.achievement.id)).not.toContain(
      "imposter_hunter",
    );

    // No duplicate unlock rows were written either.
    const stored = await getDb().achievementUnlocks.toArray();
    const firstGameRows = stored.filter(
      (r) => r.achievementId === "first_game",
    );
    expect(firstGameRows).toHaveLength(1);
  });

  it("a single game can unlock several achievements at once, all reported together", async () => {
    const bigWin: CompletedGameRecord = {
      ...baseGame,
      id: "g1",
      playerCount: 12,
      imposterCount: 3,
      winner: "imposter-win",
      players: [
        {
          playerId: "p1",
          name: "Ahmed",
          normalizedName: "ahmed",
          role: "imposter",
          eliminated: false,
          votesReceived: 0,
        },
      ],
    };
    await seedCompletedGame(bigWin);
    const session = sessionFor([{ id: "p1", name: "Ahmed" }]);

    const newlyUnlocked = await processAchievementsForCompletedGame(session);
    const ids = newlyUnlocked.map((e) => e.achievement.id).sort();
    expect(ids).toEqual(
      ["first_betrayal", "first_game", "full_house", "triple_threat"].sort(),
    );
  });

  it("keeps two local players' unlocks fully independent (player isolation)", async () => {
    const sharedGame: CompletedGameRecord = {
      ...baseGame,
      id: "g1",
      winner: "imposter-win",
      impostersCaught: 0,
      players: [
        {
          playerId: "p1",
          name: "Ahmed",
          normalizedName: "ahmed",
          role: "imposter",
          eliminated: false,
          votesReceived: 0,
        },
        {
          playerId: "p2",
          name: "Ali",
          normalizedName: "ali",
          role: "player",
          eliminated: true,
          votesReceived: 4,
        },
      ],
    };
    await seedCompletedGame(sharedGame);
    const session = sessionFor([
      { id: "p1", name: "Ahmed" },
      { id: "p2", name: "Ali" },
    ]);

    const newlyUnlocked = await processAchievementsForCompletedGame(session);
    const ahmedUnlocks = newlyUnlocked.filter(
      (e) => e.normalizedName === "ahmed",
    );
    const aliUnlocks = newlyUnlocked.filter((e) => e.normalizedName === "ali");

    expect(ahmedUnlocks.map((e) => e.achievement.id)).toContain(
      "first_betrayal",
    );
    // Ali was Crew in a game the Imposters won -- no catch, no credit,
    // and definitely no Imposter-side achievement.
    expect(aliUnlocks.map((e) => e.achievement.id)).not.toContain(
      "first_betrayal",
    );
    expect(aliUnlocks.map((e) => e.achievement.id)).not.toContain(
      "imposter_hunter",
    );
    expect(aliUnlocks.map((e) => e.achievement.id)).toContain("first_game");
  });

  it("survives being called again after a simulated reload (persistence)", async () => {
    await seedCompletedGame(baseGame);
    const session = sessionFor([{ id: "p1", name: "Ahmed" }]);
    await processAchievementsForCompletedGame(session);

    // Simulate a reload: read a fresh snapshot the way
    // AchievementsScreen does, with no in-memory state carried over.
    const snapshot = await getAchievementsSnapshot();
    const ahmed = snapshot.players.find((p) => p.normalizedName === "ahmed");
    expect(ahmed).toBeDefined();
    expect(
      snapshot.unlocksById.get("ahmed::first_game")?.unlockedAt,
    ).toBeTypeOf("number");
  });
});

describe("processAchievementsForCompletedGame -- best-effort failure handling", () => {
  it("returns an empty array instead of throwing when reading game history fails", async () => {
    await seedCompletedGame(baseGame);
    const session = sessionFor([{ id: "p1", name: "Ahmed" }]);

    const db = getDb();
    const orderBySpy = vi
      .spyOn(db.completedGames, "orderBy")
      .mockImplementationOnce(() => {
        throw new Error("simulated IndexedDB failure");
      });

    await expect(processAchievementsForCompletedGame(session)).resolves.toEqual(
      [],
    );
    // Nothing was persisted either -- a failed read must not produce a
    // partial/incorrect unlock write.
    expect(await getDb().achievementUnlocks.count()).toBe(0);

    orderBySpy.mockRestore();
  });

  it("skips a session player who has no matching completed-game context, without throwing", async () => {
    await seedCompletedGame(baseGame); // only "Ahmed" (p1) is in game history
    const session = sessionFor([
      { id: "p1", name: "Ahmed" },
      { id: "p2", name: "Ghost" }, // never recorded in any completed game
    ]);

    const newlyUnlocked = await processAchievementsForCompletedGame(session);

    expect(newlyUnlocked.some((e) => e.normalizedName === "ghost")).toBe(false);
    expect(newlyUnlocked.some((e) => e.normalizedName === "ahmed")).toBe(true);
  });
});

describe("resetAchievements", () => {
  it("clears all stored unlock history", async () => {
    await seedCompletedGame(baseGame);
    await processAchievementsForCompletedGame(
      sessionFor([{ id: "p1", name: "Ahmed" }]),
    );
    expect(await getDb().achievementUnlocks.count()).toBeGreaterThan(0);

    await resetAchievements();
    expect(await getDb().achievementUnlocks.count()).toBe(0);
  });

  it("achievement progress reads back to locked/zero once completedGames is also cleared", async () => {
    await seedCompletedGame(baseGame);
    await processAchievementsForCompletedGame(
      sessionFor([{ id: "p1", name: "Ahmed" }]),
    );

    // Full "Reset Game Data" clears both tables (see
    // lib/reset-game-data.ts) -- simulated here directly.
    await getDb().completedGames.clear();
    await resetAchievements();

    const snapshot = await getAchievementsSnapshot();
    expect(snapshot.players).toHaveLength(0);
  });
});
