import { describe, it, expect } from "vitest";
import type { CompletedGamePlayerResult, CompletedGameRecord } from "@/lib/db";
import {
  buildAchievementPlayerContexts,
  evaluateAchievementsForPlayer,
} from "@/lib/achievements/engine";
import { getAchievementById } from "@/lib/achievements/definitions";

/**
 * Pure, no-IndexedDB tests for achievement evaluation -- every
 * `CompletedGameRecord` here is constructed directly, same convention
 * as test/lib/statistics-aggregation.test.ts.
 */

function player(
  overrides: Partial<CompletedGamePlayerResult> = {},
): CompletedGamePlayerResult {
  return {
    playerId: "p1",
    name: "Ahmed",
    normalizedName: "ahmed",
    role: "player",
    eliminated: false,
    votesReceived: 0,
    ...overrides,
  };
}

function game(
  overrides: Partial<CompletedGameRecord> = {},
): CompletedGameRecord {
  return {
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
    players: [player()],
    ...overrides,
  };
}

function stateFor(
  games: CompletedGameRecord[],
  normalizedName: string,
  id: string,
) {
  const contexts = buildAchievementPlayerContexts(games);
  const ctx = contexts.get(normalizedName);
  expect(ctx).toBeDefined();
  const states = evaluateAchievementsForPlayer(ctx!);
  const state = states.find((s) => s.definition.id === id);
  expect(state).toBeDefined();
  return state!;
}

describe("first_game", () => {
  it("unlocks after a single completed game", () => {
    const games = [game({ id: "g1" })];
    const state = stateFor(games, "ahmed", "first_game");
    expect(state.unlocked).toBe(true);
    expect(state.progress).toEqual({ current: 1, target: 1 });
  });

  it("is not present (locked) for a player who has never completed a game", () => {
    const games = [
      game({
        id: "g1",
        players: [player({ name: "Ali", normalizedName: "ali" })],
      }),
    ];
    const contexts = buildAchievementPlayerContexts(games);
    expect(contexts.has("ahmed")).toBe(false);
  });
});

describe("party_starter / party_legend", () => {
  it("party_starter: progress is capped, unlocks at exactly 10, stays unlocked past it", () => {
    const nine = Array.from({ length: 9 }, (_, i) => game({ id: `g${i}` }));
    expect(stateFor(nine, "ahmed", "party_starter").unlocked).toBe(false);
    expect(stateFor(nine, "ahmed", "party_starter").progress).toEqual({
      current: 9,
      target: 10,
    });

    const ten = [...nine, game({ id: "g9" })];
    expect(stateFor(ten, "ahmed", "party_starter").unlocked).toBe(true);

    const eleven = [...ten, game({ id: "g10" })];
    const state = stateFor(eleven, "ahmed", "party_starter");
    expect(state.unlocked).toBe(true);
    // Progress never exceeds the target, even with more games played.
    expect(state.progress).toEqual({ current: 10, target: 10 });
  });

  it("party_legend: unlocks at 50 games", () => {
    const fortyNine = Array.from({ length: 49 }, (_, i) =>
      game({ id: `g${i}` }),
    );
    expect(stateFor(fortyNine, "ahmed", "party_legend").unlocked).toBe(false);

    const fifty = [...fortyNine, game({ id: "g49" })];
    expect(stateFor(fifty, "ahmed", "party_legend").unlocked).toBe(true);
  });
});

describe("crew_veteran", () => {
  it("only counts games won as Crew, not Imposter games", () => {
    const crewWins = Array.from({ length: 10 }, (_, i) =>
      game({
        id: `crew${i}`,
        winner: "crew-win",
        players: [player({ role: "player" })],
      }),
    );
    const imposterGames = Array.from({ length: 5 }, (_, i) =>
      game({
        id: `imp${i}`,
        winner: "imposter-win",
        players: [player({ role: "imposter" })],
      }),
    );

    const state = stateFor(
      [...crewWins, ...imposterGames],
      "ahmed",
      "crew_veteran",
    );
    expect(state.unlocked).toBe(true);
    expect(state.progress).toEqual({ current: 10, target: 10 });
  });

  it("crew games that were lost do not count toward Crew Veteran", () => {
    const crewLosses = Array.from({ length: 10 }, (_, i) =>
      game({
        id: `g${i}`,
        winner: "imposter-win",
        players: [player({ role: "player" })],
      }),
    );
    const state = stateFor(crewLosses, "ahmed", "crew_veteran");
    expect(state.unlocked).toBe(false);
    expect(state.progress.current).toBe(0);
  });
});

describe("first_betrayal / master_of_deception", () => {
  it("first_betrayal unlocks after the first Imposter win", () => {
    const games = [
      game({
        id: "g1",
        winner: "imposter-win",
        players: [player({ role: "imposter" })],
      }),
    ];
    expect(stateFor(games, "ahmed", "first_betrayal").unlocked).toBe(true);
  });

  it("an Imposter game that was LOST does not unlock First Betrayal", () => {
    const games = [
      game({
        id: "g1",
        winner: "crew-win",
        players: [player({ role: "imposter" })],
      }),
    ];
    expect(stateFor(games, "ahmed", "first_betrayal").unlocked).toBe(false);
  });

  it("master_of_deception unlocks at 10 Imposter wins", () => {
    const games = Array.from({ length: 10 }, (_, i) =>
      game({
        id: `g${i}`,
        winner: "imposter-win",
        players: [player({ role: "imposter" })],
      }),
    );
    expect(stateFor(games, "ahmed", "master_of_deception").unlocked).toBe(true);
  });
});

describe("imposter_hunter / sharp_eyes (crew catch-assist proxy)", () => {
  it("unlocks when the player was Crew in a game where an Imposter was caught", () => {
    const games = [
      game({
        id: "g1",
        impostersCaught: 1,
        players: [player({ role: "player" })],
      }),
    ];
    expect(stateFor(games, "ahmed", "imposter_hunter").unlocked).toBe(true);
  });

  it("does not unlock for a Crew game where no Imposter was caught", () => {
    const games = [
      game({
        id: "g1",
        impostersCaught: 0,
        players: [player({ role: "player" })],
      }),
    ];
    expect(stateFor(games, "ahmed", "imposter_hunter").unlocked).toBe(false);
  });

  it("does not credit the Imposter's own team for their own catch", () => {
    const games = [
      game({
        id: "g1",
        impostersCaught: 1,
        players: [player({ role: "imposter" })],
      }),
    ];
    expect(stateFor(games, "ahmed", "imposter_hunter").unlocked).toBe(false);
  });

  it("sharp_eyes unlocks at 10 crew catch-assists", () => {
    const games = Array.from({ length: 10 }, (_, i) =>
      game({
        id: `g${i}`,
        impostersCaught: 1,
        players: [player({ role: "player" })],
      }),
    );
    expect(stateFor(games, "ahmed", "sharp_eyes").unlocked).toBe(true);
  });
});

describe("full_house", () => {
  it("a 12-player game unlocks it", () => {
    const games = [game({ id: "g1", playerCount: 12 })];
    expect(stateFor(games, "ahmed", "full_house").unlocked).toBe(true);
  });

  it("an 11-player game does not unlock it", () => {
    const games = [game({ id: "g1", playerCount: 11 })];
    expect(stateFor(games, "ahmed", "full_house").unlocked).toBe(false);
  });
});

describe("double_trouble / triple_threat", () => {
  it("double_trouble unlocks after a won 2-imposter game", () => {
    const games = [
      game({
        id: "g1",
        imposterCount: 2,
        winner: "imposter-win",
        players: [player({ role: "imposter" })],
      }),
    ];
    expect(stateFor(games, "ahmed", "double_trouble").unlocked).toBe(true);
    expect(stateFor(games, "ahmed", "triple_threat").unlocked).toBe(false);
  });

  it("triple_threat unlocks after a won 3-imposter game", () => {
    const games = [
      game({
        id: "g1",
        imposterCount: 3,
        winner: "imposter-win",
        players: [player({ role: "imposter" })],
      }),
    ];
    expect(stateFor(games, "ahmed", "triple_threat").unlocked).toBe(true);
    expect(stateFor(games, "ahmed", "double_trouble").unlocked).toBe(false);
  });

  it("a lost multi-imposter game does not unlock either", () => {
    const games = [
      game({
        id: "g1",
        imposterCount: 2,
        winner: "crew-win",
        players: [player({ role: "imposter" })],
      }),
    ];
    expect(stateFor(games, "ahmed", "double_trouble").unlocked).toBe(false);
  });

  it("a classic (1-imposter) win does not unlock either", () => {
    const games = [
      game({
        id: "g1",
        imposterCount: 1,
        winner: "imposter-win",
        players: [player({ role: "imposter" })],
      }),
    ];
    expect(stateFor(games, "ahmed", "double_trouble").unlocked).toBe(false);
    expect(stateFor(games, "ahmed", "triple_threat").unlocked).toBe(false);
  });
});

describe("player isolation", () => {
  it("one player's games never affect another player's context", () => {
    const games = [
      game({
        id: "g1",
        winner: "imposter-win",
        imposterCount: 3,
        playerCount: 12,
        impostersCaught: 0,
        players: [
          player({
            playerId: "p1",
            name: "Ahmed",
            normalizedName: "ahmed",
            role: "imposter",
          }),
          player({
            playerId: "p2",
            name: "Ali",
            normalizedName: "ali",
            role: "player",
          }),
        ],
      }),
    ];

    const ahmed = stateFor(games, "ahmed", "triple_threat");
    const ali = stateFor(games, "ali", "triple_threat");
    expect(ahmed.unlocked).toBe(true);
    expect(ali.unlocked).toBe(false);

    // Ali was crew in a game the imposters WON -- no imposter was
    // caught, so Ali does not get Imposter Hunter credit either.
    expect(stateFor(games, "ali", "imposter_hunter").unlocked).toBe(false);
  });
});

describe("Custom Words compatibility", () => {
  it("a Custom Words game (category is the custom pseudo-category) still counts toward ordinary achievements", () => {
    const games = [game({ id: "g1", category: "custom" })];
    expect(stateFor(games, "ahmed", "first_game").unlocked).toBe(true);
  });
});

describe("getAchievementById sanity for every evaluated id used above", () => {
  it("every id referenced in these tests is a real, defined achievement", () => {
    for (const id of [
      "first_game",
      "party_starter",
      "party_legend",
      "crew_veteran",
      "first_betrayal",
      "master_of_deception",
      "imposter_hunter",
      "sharp_eyes",
      "full_house",
      "double_trouble",
      "triple_threat",
    ]) {
      expect(getAchievementById(id)).toBeDefined();
    }
  });
});
