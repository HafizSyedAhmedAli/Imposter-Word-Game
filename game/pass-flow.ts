import type { Player, PlayerRole, RoundSession } from "./game-types";

/**
 * Screen 5's own state machine. Kept separate from `RoundStatus`
 * (preparing/ready/playing/finished) -- that field describes the round
 * as a whole, while this describes where the *current player* is inside
 * their own pass-the-phone turn. Never persisted: on refresh the safe
 * default is always "pass-phone" (see spec sections 23 + 66).
 */
export type PassState =
  | "pass-phone"
  | "private-reveal"
  | "revealed"
  | "all-ready";

/**
 * Resolves the player whose turn it currently is. Uses
 * `currentPlayerIndex` directly -- Screen 5 must never re-shuffle
 * `players` or recompute turn order (see spec section 25).
 */
export function getCurrentPlayer(session: RoundSession): Player | null {
  return session.players[session.currentPlayerIndex] ?? null;
}

/**
 * Looks up the current player's role by ID -- never by name or array
 * position, since names aren't guaranteed unique (see spec sections
 * 31-32). Returns null only if the session is malformed.
 */
export function getCurrentPlayerRole(session: RoundSession): PlayerRole | null {
  const player = getCurrentPlayer(session);
  if (!player) return null;
  return session.round.roles.find((r) => r.playerId === player.id) ?? null;
}

export function isFinalPlayer(session: RoundSession): boolean {
  return session.currentPlayerIndex === session.players.length - 1;
}

/**
 * Advances the session to the next player's turn. This is the ONLY
 * mutation Screen 5 performs on the round session (aside from starting
 * discussion, see `beginDiscussion` below) -- word, hint, and roles are
 * carried over untouched (see spec sections 2 + 24).
 */
export function advanceToNextPlayer(session: RoundSession): RoundSession {
  return {
    ...session,
    currentPlayerIndex: session.currentPlayerIndex + 1,
  };
}

/**
 * Transitions the round out of the pass-the-phone flow once every player
 * has seen their role. Screen 6 owns everything after this point (see
 * spec sections 28 + 90).
 */
export function beginDiscussion(session: RoundSession): RoundSession {
  return {
    ...session,
    status: "playing",
  };
}
