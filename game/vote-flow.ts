// game/vote-flow.ts
import type { Player, RoundSession } from "./game-types";
import { getActivePlayers, isEliminated } from "./elimination";

/**
 * Screen 7's own state machine, kept separate from `RoundStatus`
 * (preparing/ready/playing/finished) for the same reason `PassState` and
 * discussion's local state are -- voting has UI state (which private
 * hand-off card is showing, whether a target is selected) that has
 * nothing to do with the persisted round, and must never be written
 * back into `RoundSession`. Never persisted: on refresh the safe default
 * is always derived fresh from `session.votes` (see `getCurrentVoter`
 * below and spec sections 58-64), never resumed from wherever the UI
 * happened to be when the tab closed.
 */
export type VoteScreenState =
  | "pass-phone" // confirming the phone has been physically handed to the next voter
  | "voting" // that voter is privately choosing a target
  | "confirm" // one extra tap before the vote is locked in (spec section 22)
  | "recorded" // this voter's vote is in; handing off to the next one
  | "all-cast"; // every player has voted

/**
 * The deterministic voting order: identical to `players` array order,
 * same as Screen 6's speaking order. Voting must NEVER use role order,
 * randomize, or change mid-round (see spec section 39-42) -- so this is
 * deliberately just `session.players`, not a sorted or filtered copy.
 */
export function getVotingOrder(session: RoundSession): Player[] {
  return session.players;
}

/**
 * Resolves whose private voting turn it is right now, skipping
 * eliminated players entirely -- they don't get asked to vote in a
 * round they're no longer part of.
 */
export function getCurrentVoter(session: RoundSession): Player | null {
  return (
    getActivePlayers(session).find((player) => !hasVoted(session, player.id)) ??
    null
  );
}

/** Active players only -- what "how many are we waiting on" should count. */
export function getActiveVotingOrder(session: RoundSession): Player[] {
  return getActivePlayers(session);
}

export function getVotesCastCount(session: RoundSession): number {
  return getActivePlayers(session).filter((p) => hasVoted(session, p.id))
    .length;
}

/**
 * Every player a given voter may select: everyone active except
 * themselves. Eliminated players are never eligible targets going
 * forward -- this is the actual fix for "round not starting with that
 * crew absent" (they were never removed from this list before).
 */
export function getEligibleVoteTargets(
  session: RoundSession,
  voterId: string,
): Player[] {
  return getActivePlayers(session).filter((player) => player.id !== voterId);
}

export function submitVote(
  session: RoundSession,
  voterId: string,
  targetId: string,
): RoundSession {
  const currentVoter = getCurrentVoter(session);
  if (!currentVoter || currentVoter.id !== voterId) return session;
  if (targetId === voterId) return session;
  if (hasVoted(session, voterId)) return session;
  if (isEliminated(session, voterId) || isEliminated(session, targetId))
    return session; // defense in depth

  return {
    ...session,
    votes: { ...getVotes(session), [voterId]: targetId },
  };
}

/**
 * Sentinel stored in `session.votes[voterId]` for a player who chose
 * not to accuse anyone, or whose personal voting timer ran out before
 * they picked a target. Deliberately just a string in the same
 * `Record<string, string>` shape as a real vote (not a separate
 * `null`/optional field) -- every existing consumer of `session.votes`
 * (getVoteTally, hasVoted, etc.) already treats "the value doesn't
 * match a real player id" as "doesn't count toward anyone's tally",
 * so a skip needs zero changes anywhere outside this file to be
 * correctly ignored by results-flow.ts's vote counting.
 */
export const SKIP_VOTE = "__skip__";

/**
 * Records that the current voter is passing without accusing anyone --
 * either tapped "Skip Vote" themselves, or their personal timer expired
 * (see VoteScreen.tsx's handleVotingTimerExpire). Same guards as
 * submitVote: only the actual current voter can skip, only once, and
 * never for an eliminated player.
 */
export function skipVote(session: RoundSession, voterId: string): RoundSession {
  const currentVoter = getCurrentVoter(session);
  if (!currentVoter || currentVoter.id !== voterId) return session;
  if (hasVoted(session, voterId)) return session;
  if (isEliminated(session, voterId)) return session;

  return {
    ...session,
    votes: { ...getVotes(session), [voterId]: SKIP_VOTE },
  };
}

/**
 * Defensive accessor -- older/partial `RoundSession`s persisted before
 * this screen existed won't have a `votes` field at all. Every other
 * function in this module reads votes through this helper so "no votes
 * yet" and "votes field missing" behave identically, rather than
 * crashing on `Object.keys(undefined)`.
 */
function getVotes(session: RoundSession): Record<string, string> {
  return session.votes ?? {};
}

export function hasVoted(session: RoundSession, playerId: string): boolean {
  return Object.prototype.hasOwnProperty.call(getVotes(session), playerId);
}

export function isVotingComplete(session: RoundSession): boolean {
  return getCurrentVoter(session) === null;
}

/**
 * Resolves how long the voting timer should run for, straight from the
 * round's own config (Screen 2) -- same pattern as
 * discussion-flow.ts's `getDiscussionDuration`. Returns `null` when the
 * host turned the voting timer off, so callers render an untimed
 * voting phase instead of a fake "00:00" (spec section 45).
 */
export function getVotingDuration(session: RoundSession): number | null {
  const timer = session.config.options.votingTimer;
  return timer.enabled ? timer.duration : null;
}
