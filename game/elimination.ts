// game/elimination.ts
import type { Player, RoundSession } from "./game-types";

/**
 * Shared elimination helpers. Lives in its own module (not inside
 * results-flow.ts) because vote-flow.ts and discussion-flow.ts both
 * need "who's still playing" and neither should have to import a
 * "results" module to answer that.
 */

export function getEliminatedPlayerIds(session: RoundSession): string[] {
  return session.eliminatedPlayerIds ?? [];
}

export function isEliminated(session: RoundSession, playerId: string): boolean {
  return getEliminatedPlayerIds(session).includes(playerId);
}

/**
 * Every player still in the game, in original `session.players` order.
 * This is what discussion/voting iterate over from round 2 onward.
 * `session.players` itself is NEVER spliced/filtered in place -- it
 * stays the full original roster forever, so seat-based avatar colors
 * and role lookups (which key off that array) never shift underneath
 * an eliminated player either.
 */
export function getActivePlayers(session: RoundSession): Player[] {
  return session.players.filter((player) => !isEliminated(session, player.id));
}
