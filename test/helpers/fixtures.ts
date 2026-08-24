import type { Player, PlayerRole, RoundSession } from "@/game/game-types";
import { DEFAULT_GAME_CONFIG } from "@/game/game-rules";

/**
 * A realistic 4-player session: p1 is the imposter, p2-p4 are crew.
 * Deliberately small and fixed (not randomized) so every test built on
 * top of it is fully deterministic.
 */
export function baseSession(
  overrides: Partial<RoundSession> = {},
): RoundSession {
  const players: Player[] = [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
    { id: "p3", name: "Cara" },
    { id: "p4", name: "Dev" },
  ];

  const roles: PlayerRole[] = [
    { playerId: "p1", role: "imposter" },
    { playerId: "p2", role: "player" },
    { playerId: "p3", role: "player" },
    { playerId: "p4", role: "player" },
  ];

  const session: RoundSession = {
    id: "session-1",
    config: DEFAULT_GAME_CONFIG,
    players,
    round: {
      number: 1,
      word: "Pizza",
      hint: "A round dish often shared in slices.",
      imposterCount: 1,
      roles,
      contentSource: "fallback",
    },
    status: "playing",
    currentPlayerIndex: 0,
    votes: {},
  };

  return { ...session, ...overrides };
}

/** A 9-player / 2-imposter session, for multi-imposter regression coverage. */
export function multiImposterSession(
  overrides: Partial<RoundSession> = {},
): RoundSession {
  const players: Player[] = Array.from({ length: 9 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
  }));

  const roles: PlayerRole[] = players.map((p, i) => ({
    playerId: p.id,
    // p1 and p2 are imposters; everyone else is crew.
    role: i < 2 ? "imposter" : "player",
  }));

  const session: RoundSession = {
    id: "session-multi",
    config: { ...DEFAULT_GAME_CONFIG, mode: "double" },
    players,
    round: {
      number: 1,
      word: "Sushi",
      hint: "Often served in small, bite-sized pieces.",
      imposterCount: 2,
      roles,
      contentSource: "fallback",
    },
    status: "playing",
    currentPlayerIndex: 0,
    votes: {},
  };

  return { ...session, ...overrides };
}
