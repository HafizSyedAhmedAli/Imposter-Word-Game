// game/results-flow.ts
import type { Player, RoundSession } from "./game-types";
import { getActivePlayers, getEliminatedPlayerIds, isEliminated } from "./elimination";
/**
 * Screen 8's pure decision layer. Nothing here touches the DOM or
 * sessionStorage directly -- ResultsScreen.tsx calls these functions and
 * persists whatever they return, same separation as game/vote-flow.ts.
 * Every function takes RoundSession as its only source of truth (spec's
 * "Game Outcome Logic": never determine the result from UI text).
 */

export type VoteTally = {
  player: Player;
  /** Seat index in `session.players` order -- used only for avatar color,
   *  matching the pattern in VoteScreen.tsx's `playerIndexById`. */
  index: number;
  votes: number;
};

function getVotes(session: RoundSession): Record<string, string> {
  return session.votes ?? {};
}

/**
 * Vote totals for every player, kept in stable `players` array order
 * (not sorted by count) -- the results list shouldn't visually reshuffle
 * relative to the ballot the group just voted on. Computed fresh from
 * `session.votes` every time, never cached, so it can never drift from
 * the actual ballots cast (spec: "Calculate vote totals from the stored
 * votes rather than maintaining a second conflicting source of truth").
 */
export function getVoteTally(session: RoundSession): VoteTally[] {
  const votes = getVotes(session);
  const counts = new Map<string, number>();
  for (const targetId of Object.values(votes)) {
    counts.set(targetId, (counts.get(targetId) ?? 0) + 1);
  }
  return session.players.map((player, index) => ({
    player,
    index,
    votes: counts.get(player.id) ?? 0,
  }));
}

export function getHighestVoteCount(tally: VoteTally[]): number {
  return tally.reduce((max, entry) => Math.max(max, entry.votes), 0);
}

/** Every player tied for the most votes. Empty only if no votes exist at all. */
export function getMostVotedPlayers(session: RoundSession): VoteTally[] {
  const tally = getVoteTally(session);
  const highest = getHighestVoteCount(tally);
  if (highest === 0) return [];
  return tally.filter((entry) => entry.votes === highest);
}

function getRoleForPlayer(
  session: RoundSession,
  playerId: string,
): "player" | "imposter" | null {
  return session.round.roles.find((r) => r.playerId === playerId)?.role ?? null;
}

export type Verdict =
  | { type: "tie"; tied: VoteTally[] }
  | { type: "imposter-caught"; eliminated: Player }
  | { type: "wrong-player"; eliminated: Player };

/**
 * The three possible outcomes of THIS vote (spec's "Possible states").
 * A tie is any time more than one player shares the top vote count --
 * this is checked before anything else, so a tie can never silently
 * resolve to whichever player happened to be first in the array.
 */
export function getVerdict(session: RoundSession): Verdict {
  const mostVoted = getMostVotedPlayers(session);
  if (mostVoted.length !== 1) {
    return { type: "tie", tied: mostVoted };
  }
  const { player } = mostVoted[0];
  const role = getRoleForPlayer(session, player.id);
  return role === "imposter"
    ? { type: "imposter-caught", eliminated: player }
    : { type: "wrong-player", eliminated: player };
}

export function getTotalImposterCount(session: RoundSession): number {
  return session.round.roles.filter((r) => r.role === "imposter").length;
}

/**
 * Applies this vote's verdict to the persisted elimination list. A tie
 * eliminates no one (spec's initial tie rule -- "NO ONE IS ELIMINATED").
 * Idempotent: if the verdict's target is already in the list (e.g. the
 * player refreshed after this already ran once), returns `session`
 * unchanged instead of double-adding -- this is what makes the Results
 * screen refresh-safe (spec: "must survive a page refresh without
 * losing the results").
 */
export function applyVerdict(session: RoundSession): RoundSession {
  const verdict = getVerdict(session);
  if (verdict.type === "tie") return session;

  const existing = getEliminatedPlayerIds(session);
  if (existing.includes(verdict.eliminated.id)) return session;

  return {
    ...session,
    eliminatedPlayerIds: [...existing, verdict.eliminated.id],
  };
}

export type RoundOutcome = "crew-win" | "imposter-win" | "continue";

/**
 * Standard social-deduction win check, derived purely from
 * `session.round.roles` + `session.eliminatedPlayerIds` -- never
 * hard-coded, so it works identically for 1, 2, or 3 imposters (spec's
 * "IMPORTANT: MULTIPLE IMPOSTERS"). Crew wins once every imposter is
 * eliminated; imposters win once they're no longer outnumbered by the
 * surviving crew; otherwise the round continues and remaining imposters
 * stay hidden (spec's "IMPORTANT GAME RULE").
 */
export function getRoundOutcome(session: RoundSession): RoundOutcome {
  const eliminated = new Set(getEliminatedPlayerIds(session));
  const aliveImposters = session.round.roles.filter(
    (r) => r.role === "imposter" && !eliminated.has(r.playerId),
  ).length;
  const aliveCrew = session.round.roles.filter(
    (r) => r.role === "player" && !eliminated.has(r.playerId),
  ).length;

  if (aliveImposters === 0) return "crew-win";
  if (aliveImposters >= aliveCrew) return "imposter-win";
  return "continue";
}

/**
 * Builds the next round of THIS SAME game after a "continue" verdict --
 * same word, hint, and role assignments (the spec never says catching
 * one imposter should re-shuffle who the rest are), just a fresh
 * discussion + vote cycle among whoever's still standing.
 * `eliminatedPlayerIds` carries over untouched; `votes` resets so the
 * next vote starts clean; `round.number` increments for display only.
 */
export function continueRound(session: RoundSession): RoundSession {
  return {
    ...session,
    round: { ...session.round, number: session.round.number + 1 },
    votes: {},
    status: "playing",
  };
}

export { getEliminatedPlayerIds, isEliminated }; // unchanged call sites (ResultsScreen etc.) keep working