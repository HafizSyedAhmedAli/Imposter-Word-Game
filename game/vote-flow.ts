// game/vote-flow.ts
import type { Player, RoundSession } from "./game-types";

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

/**
 * Resolves whose private voting turn it is right now: the first player
 * in voting order who hasn't cast a vote yet. This is the ONLY source of
 * truth for "current voter" -- there is intentionally no persisted
 * index to keep in sync, so a mid-voting page refresh recovers exactly
 * where it left off (spec sections 60-64) without re-asking anyone who
 * already voted to vote again. Returns `null` once everyone has voted.
 */
export function getCurrentVoter(session: RoundSession): Player | null {
  return (
    getVotingOrder(session).find((player) => !hasVoted(session, player.id)) ??
    null
  );
}

export function isVotingComplete(session: RoundSession): boolean {
  return getCurrentVoter(session) === null;
}

export function getVotesCastCount(session: RoundSession): number {
  return Object.keys(getVotes(session)).length;
}

/**
 * Every player a given voter is allowed to select -- everyone except
 * themselves. Self-voting is filtered out here, at the data layer, so
 * that no rendering path (keyboard, mouse, touch, or a bug in the
 * selection UI) can ever produce a self-vote by construction, not just
 * by a disabled button (spec section 12).
 */
export function getEligibleVoteTargets(
  session: RoundSession,
  voterId: string,
): Player[] {
  return getVotingOrder(session).filter((player) => player.id !== voterId);
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

/**
 * Records one voter's ballot and returns a new session -- the only
 * mutation this module performs (word, hint, roles, and every earlier
 * vote are carried over untouched). Guards, in order:
 *
 *  - the voter must actually be the current voter (blocks a stale
 *    private-voting screen -- e.g. two tabs, or a slow tap after a
 *    refresh already advanced the turn -- from recording out of turn)
 *  - a player can never vote for themselves (spec section 12)
 *  - a player who already voted can never vote again (spec section 55)
 *
 * Any violation returns `session` unchanged rather than throwing, since
 * these are all "shouldn't happen if the UI is honest" cases -- the
 * caller UI should never present the option in the first place.
 */
export function submitVote(
  session: RoundSession,
  voterId: string,
  targetId: string,
): RoundSession {
  const currentVoter = getCurrentVoter(session);
  if (!currentVoter || currentVoter.id !== voterId) return session;
  if (targetId === voterId) return session;
  if (hasVoted(session, voterId)) return session;

  return {
    ...session,
    votes: {
      ...getVotes(session),
      [voterId]: targetId,
    },
  };
}
