// game/final-results-flow.ts
import type { Player, RoundSession } from "./game-types";
import { getModeDisplayName } from "./game-rules";
import { getEliminatedPlayerIds, isEliminated } from "./elimination";
import {
  getRoundOutcome,
  getVerdict,
  getVoteTally,
  type RoundOutcome,
  type Verdict,
  type VoteTally,
} from "./results-flow";

/**
 * Screen 9's pure decision layer -- the FINAL results screen, distinct
 * from Screen 8's per-vote game/results-flow.ts (which only resolves a
 * single vote). Nothing here touches the DOM or storage; a future
 * FinalResultsScreen.tsx calls these and renders whatever they return,
 * same separation as every other `*-flow` module in this codebase.
 *
 * Note on scope: this codebase's `RoundSession` has no "final guess"
 * field -- only vote-based elimination exists today (see
 * game/game-types.ts). Every outcome/reason below is derived strictly
 * from `session.round.roles` + `session.eliminatedPlayerIds`, the
 * actual source of truth, rather than inventing a second one to match
 * a mock/spec that assumes a mechanic that isn't built yet. If a final
 * guess is added later, it slots in here without any UI changes needed
 * beyond an extra card.
 */

export type FinalOutcome = Extract<RoundOutcome, "crew-win" | "imposter-win">;

/**
 * The round is only truly "final" once every imposter is caught or the
 * imposters have overtaken the crew -- `getRoundOutcome` returning
 * "continue" means voting/elimination is still ongoing and Screen 9 was
 * reached too early (a deep link, a stale tab, browser back/forward
 * racing a `continueRound`). Returns `null` in that case so the screen
 * can redirect back into the live round instead of rendering a false
 * "game over" (spec's "IMPORTANT NAVIGATION RULE").
 */
export function getFinalOutcome(session: RoundSession): FinalOutcome | null {
  const outcome = getRoundOutcome(session);
  return outcome === "continue" ? null : outcome;
}

/**
 * The one-line "why" under the winner headline (spec's "WIN REASON").
 * Derived the same way `getRoundOutcome` derived the outcome itself --
 * imposter/crew counts -- never hard-coded text picked purely because a
 * screen says "crew won" (spec: "Do NOT hard-code the reason").
 */
export function getWinReason(session: RoundSession, outcome: FinalOutcome): string {
  const totalImposters = session.round.roles.filter(
    (r) => r.role === "imposter",
  ).length;
  const eliminated = new Set(getEliminatedPlayerIds(session));
  const impostersCaught = session.round.roles.filter(
    (r) => r.role === "imposter" && eliminated.has(r.playerId),
  ).length;

  if (outcome === "crew-win") {
    return totalImposters === 1
      ? "The imposter was caught."
      : `All ${totalImposters} imposters were caught.`;
  }

  // imposter-win
  return impostersCaught === 0
    ? "The imposter(s) were never caught."
    : "Too many crew members were eliminated.";
}

export type FinalPlayerResult = {
  player: Player;
  /** Seat index in `session.players` order -- for avatar color, same
   *  convention as `VoteTally.index` in results-flow.ts. */
  index: number;
  role: "player" | "imposter";
  eliminated: boolean;
};

function getRole(session: RoundSession, playerId: string): "player" | "imposter" {
  return session.round.roles.find((r) => r.playerId === playerId)?.role ?? "player";
}

/**
 * Every player's full public result, in stable seat order -- the
 * complete role reveal (spec's "PLAYER RESULTS"). This is the first
 * screen allowed to surface every player's role at once; every earlier
 * screen deliberately reveals at most one role per verdict.
 */
export function getFinalPlayerResults(session: RoundSession): FinalPlayerResult[] {
  return session.players.map((player, index) => ({
    player,
    index,
    role: getRole(session, player.id),
    eliminated: isEliminated(session, player.id),
  }));
}

/**
 * Just the imposters, in seat order (spec's "WHO WERE THE IMPOSTERS?").
 * Works identically for 1, 2, or 3 imposters -- never assumes exactly
 * one (spec's "MULTIPLE IMPOSTERS").
 */
export function getFinalImposters(session: RoundSession): FinalPlayerResult[] {
  return getFinalPlayerResults(session).filter((r) => r.role === "imposter");
}

/**
 * The last verdict that actually ended the game -- reused as-is rather
 * than recomputed, since it's the same tally/verdict Screen 8 already
 * showed right before this round's final `continueRound`/game-over
 * transition (spec's "ELIMINATION RESULT").
 */
export function getFinalVerdict(session: RoundSession): Verdict {
  return getVerdict(session);
}

/**
 * Aggregated vote totals only (spec is explicit: never show who voted
 * for whom). `session.votes` resets every `continueRound`, so this is
 * always just the final vote of the game -- the one that produced
 * `getFinalVerdict`'s outcome.
 */
export function getFinalVoteTally(session: RoundSession): VoteTally[] {
  return getVoteTally(session);
}

export type RoundSummary = {
  category: string;
  difficulty: string;
  mode: string;
  playerCount: number;
  imposterCount: number;
};

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

/**
 * The compact config recap (spec's "ROUND SUMMARY"). Pulled straight
 * from `session.config` / `session.round` -- never re-derived or
 * guessed, so it can never drift from what was actually played.
 */
export function getRoundSummary(session: RoundSession): RoundSummary {
  return {
    category: capitalize(session.config.category),
    difficulty: capitalize(session.config.difficulty),
    mode: getModeDisplayName(session.config.mode),
    playerCount: session.players.length,
    imposterCount: session.round.imposterCount,
  };
}