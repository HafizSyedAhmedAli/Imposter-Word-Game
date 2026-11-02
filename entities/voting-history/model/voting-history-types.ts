// entities/voting-history/model/voting-history-types.ts

/**
 * NOTE: these three types moved here from `game/game-types.ts` -- see
 * entities/README.md. Deliberately just types, no functions: the logic
 * that builds and appends a `VotingHistoryEntry` onto a `RoundSession`
 * (`getVotingHistory`/`recordVotingHistoryEntry`) stays in
 * `game/results-flow.ts` for now -- that's cross-entity round
 * orchestration, `features/play-round` territory once that slice
 * exists, not this one. This entity only owns the shape of the data.
 */

/** One player's vote count within a single recorded voting round. */
export type VotingHistoryTallyEntry = {
  playerId: string;
  playerName: string;
  votes: number;
};

/** The outcome of a single recorded voting round -- mirrors `Verdict`
 *  in game/results-flow.ts, but by player id/name rather than a full
 *  `Player` object (see `VotingHistoryEntry`'s comment for why). */
export type VotingHistoryVerdict =
  | { type: "tie"; tiedPlayerIds: string[] }
  | { type: "imposter-caught"; eliminatedPlayerId: string }
  | { type: "wrong-player"; eliminatedPlayerId: string };

/** One completed voting round, as shown on the Voting History view. */
export type VotingHistoryEntry = {
  round: number;
  tally: VotingHistoryTallyEntry[];
  verdict: VotingHistoryVerdict;
};
