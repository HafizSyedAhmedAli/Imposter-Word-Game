// game/discussion-flow.ts
import type { Player, RoundSession } from "./game-types";

/**
 * Screen 6's own logic helpers. Kept separate from `RoundStatus`
 * (preparing/ready/playing/finished) for the same reason pass-flow.ts's
 * `PassState` is -- discussion needs some public UI state (timer
 * progress) that has nothing to do with the persisted round, and must
 * never be confused with it or written back into `RoundSession` (see
 * game/game-types.ts, RoundSession).
 *
 * Screen 6 does NOT track a "current speaker" -- the phone is only
 * passed during Screen 5. Once discussion starts, players manage clue
 * order themselves out loud; the app just shows the static order once
 * (see components/game/DiscussionClueOrderCard.tsx).
 */

/**
 * Resolves how long the discussion timer should run for, straight from
 * the round's own config (Screen 2) -- Screen 6 never invents its own
 * duration or hardcodes one. Returns `null` when the host turned the
 * discussion timer off, so callers can render an untimed discussion
 * instead of a fake "00:00".
 */
export function getDiscussionDuration(session: RoundSession): number | null {
  const timer = session.config.options.discussionTimer;
  return timer.enabled ? timer.duration : null;
}

/**
 * The public speaking order for discussion. Deliberately just
 * `session.players` -- Screen 6 must never re-shuffle, filter, or
 * annotate this with role information. Both the clue-order list and the
 * players list read from this same function, so there's exactly one
 * source of truth for "who's playing, in what order".
 */
export function getSpeakingOrder(session: RoundSession): Player[] {
  return session.players;
}
