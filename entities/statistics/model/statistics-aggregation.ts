
/**
 * The pure "Statistics Aggregator" step of the pipeline described in the
 * Statistics feature spec (see lib/statistics-record.ts's doc comment
 * for the full pipeline). Every function here takes the full set of
 * locally-stored `CompletedGameRecord`s and derives numbers from them --
 * nothing here talks to Dexie, and nothing here re-decides a game's
 * winner/roles (those are already fixed facts on each record by the
 * time it gets here). Kept as small, pure functions so every aggregate
 * is independently unit-testable (test/lib/statistics-aggregation.test.ts)
 * and the Statistics screen components never have to compute a rate or
 * a "most played" value themselves.
 *
 * Every game in this table has a winner that is either "crew-win" or
 * "imposter-win" (see game/results-flow.ts's `getRoundOutcome` -- there
 * is no third/draw outcome). That means "every game where crew could
 * win" and "every game where imposters could win" are both simply
 * "every completed game" -- so `gamesPlayed` is always the correct,
 * mathematically consistent denominator for both crew and imposter win
 * rates (spec's "WIN RATE CALCULATIONS": never divide by an unrelated
 * total).
 */

import { CompletedGameRecord } from "./completed-game-store";

/** Safely turns a ratio into a whole-number percentage. Returns 0 -- not
 * NaN/Infinity -- when `denominator` is 0 (spec's "handle zero values
 * safely"). */
function ratePercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

/** Rounds to one decimal place, safely returning 0 for a zero
 * denominator instead of NaN. */
function averageOneDecimal(total: number, count: number): number {
  if (count <= 0) return 0;
  return Math.round((total / count) * 10) / 10;
}

/** The most frequent value in `values`, or `null` if `values` is empty.
 * Ties resolve to whichever value was seen first, so this is stable and
 * deterministic given the same (chronologically ordered) input. */
function mostFrequent<T>(values: T[]): T | null {
  if (values.length === 0) return null;
  const counts = new Map<T, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let best: T = values[0];
  let bestCount = 0;
  for (const value of values) {
    const count = counts.get(value) ?? 0;
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

export type GlobalStatistics = {
  gamesPlayed: number;
  crewWins: number;
  imposterWins: number;
  /** 0-100, whole percent. */
  crewWinRate: number;
  /** 0-100, whole percent. */
  imposterWinRate: number;
  totalRounds: number;
  totalVotesCast: number;
  totalPlayersParticipated: number;
  totalImpostersPlayed: number;
  totalImpostersCaught: number;
  /**
   * Always 0 today: this codebase has no "final guess" mechanic yet --
   * only vote-based elimination exists (see
   * game/final-results-flow.ts's doc comment). Kept as a real field
   * (not omitted) so a future guess feature can populate it without a
   * schema or aggregation-shape change; the Statistics screen
   * deliberately does not render a card for this yet, since a
   * permanently-zero stat isn't useful to show a player (spec's "do not
   * add meaningless statistics").
   */
  totalSuccessfulImposterGuesses: number;
  /** See `totalSuccessfulImposterGuesses` above. */
  totalFailedImposterGuesses: number;
  averagePlayersPerGame: number;
  averageRoundsPerGame: number;
  mostPlayedCategory: string | null;
  mostPlayedDifficulty: string | null;
  mostPlayedMode: string | null;
};

export const EMPTY_GLOBAL_STATISTICS: GlobalStatistics = {
  gamesPlayed: 0,
  crewWins: 0,
  imposterWins: 0,
  crewWinRate: 0,
  imposterWinRate: 0,
  totalRounds: 0,
  totalVotesCast: 0,
  totalPlayersParticipated: 0,
  totalImpostersPlayed: 0,
  totalImpostersCaught: 0,
  totalSuccessfulImposterGuesses: 0,
  totalFailedImposterGuesses: 0,
  averagePlayersPerGame: 0,
  averageRoundsPerGame: 0,
  mostPlayedCategory: null,
  mostPlayedDifficulty: null,
  mostPlayedMode: null,
};

export function computeGlobalStatistics(
  games: CompletedGameRecord[],
): GlobalStatistics {
  if (games.length === 0) return EMPTY_GLOBAL_STATISTICS;

  const gamesPlayed = games.length;
  const crewWins = games.filter((g) => g.winner === "crew-win").length;
  const imposterWins = games.filter((g) => g.winner === "imposter-win").length;

  const totalRounds = games.reduce((sum, g) => sum + g.roundsPlayed, 0);
  const totalPlayersParticipated = games.reduce(
    (sum, g) => sum + g.playerCount,
    0,
  );
  const totalImpostersPlayed = games.reduce(
    (sum, g) => sum + g.imposterCount,
    0,
  );
  const totalImpostersCaught = games.reduce(
    (sum, g) => sum + g.impostersCaught,
    0,
  );
  const totalVotesCast = games.reduce(
    (sum, g) =>
      sum + g.players.reduce((gameSum, p) => gameSum + p.votesReceived, 0),
    0,
  );

  return {
    gamesPlayed,
    crewWins,
    imposterWins,
    crewWinRate: ratePercent(crewWins, gamesPlayed),
    imposterWinRate: ratePercent(imposterWins, gamesPlayed),
    totalRounds,
    totalVotesCast,
    totalPlayersParticipated,
    totalImpostersPlayed,
    totalImpostersCaught,
    totalSuccessfulImposterGuesses: 0,
    totalFailedImposterGuesses: 0,
    averagePlayersPerGame: averageOneDecimal(
      totalPlayersParticipated,
      gamesPlayed,
    ),
    averageRoundsPerGame: averageOneDecimal(totalRounds, gamesPlayed),
    mostPlayedCategory: mostFrequent(games.map((g) => g.category)),
    mostPlayedDifficulty: mostFrequent(games.map((g) => g.difficulty)),
    mostPlayedMode: mostFrequent(games.map((g) => g.mode)),
  };
}

export type PlayerStatistics = {
  normalizedName: string;
  /** The name as it was entered in this local player's most recent
   * game -- display only, matching never depends on casing/whitespace
   * (see `normalizedName`). */
  displayName: string;
  gamesPlayed: number;
  crewGames: number;
  imposterGames: number;
  crewWins: number;
  imposterWins: number;
  timesVotedOut: number;
  timesVotedFor: number;
  /** 0-100, whole percent: (crewWins + imposterWins) / gamesPlayed. */
  winRate: number;
  /** 0-100, whole percent: crewWins / crewGames. */
  crewWinRate: number;
  /** 0-100, whole percent: imposterWins / imposterGames. */
  imposterWinRate: number;
  /** 0-100, whole percent: how often this player was voted out while an
   * imposter, out of every game they played as an imposter. */
  catchRate: number;
};

/**
 * Aggregates lifetime per-player statistics across every completed
 * game, grouped by `normalizedName` -- the same trimmed/lowercased name
 * a player enters is treated as one continuous local player, regardless
 * of casing or stray whitespace on any individual game (spec's
 * "PLAYER-LEVEL STATISTICS": handle names consistently). `games` is
 * expected oldest-first (see lib/db.ts's `getCompletedGames`), so the
 * last game contributing to a group is that player's most recent --
 * used only to pick a stable, current-feeling display name.
 *
 * Returned in descending `gamesPlayed` order, so the Statistics screen's
 * player list naturally leads with whoever has played the most.
 */
export function computePlayerStatistics(
  games: CompletedGameRecord[],
): PlayerStatistics[] {
  type Accumulator = {
    normalizedName: string;
    displayName: string;
    gamesPlayed: number;
    crewGames: number;
    imposterGames: number;
    crewWins: number;
    imposterWins: number;
    timesVotedOut: number;
    timesVotedFor: number;
    timesCaughtAsImposter: number;
  };

  const byName = new Map<string, Accumulator>();

  for (const game of games) {
    for (const player of game.players) {
      const existing = byName.get(player.normalizedName);
      const acc: Accumulator =
        existing ??
        ({
          normalizedName: player.normalizedName,
          displayName: player.name,
          gamesPlayed: 0,
          crewGames: 0,
          imposterGames: 0,
          crewWins: 0,
          imposterWins: 0,
          timesVotedOut: 0,
          timesVotedFor: 0,
          timesCaughtAsImposter: 0,
        } satisfies Accumulator);

      acc.gamesPlayed += 1;
      acc.displayName = player.name; // last game wins -- most current name.
      acc.timesVotedFor += player.votesReceived;
      if (player.eliminated) acc.timesVotedOut += 1;

      if (player.role === "imposter") {
        acc.imposterGames += 1;
        if (game.winner === "imposter-win") acc.imposterWins += 1;
        if (player.eliminated) acc.timesCaughtAsImposter += 1;
      } else {
        acc.crewGames += 1;
        if (game.winner === "crew-win") acc.crewWins += 1;
      }

      byName.set(player.normalizedName, acc);
    }
  }

  return Array.from(byName.values())
    .map((acc) => ({
      normalizedName: acc.normalizedName,
      displayName: acc.displayName,
      gamesPlayed: acc.gamesPlayed,
      crewGames: acc.crewGames,
      imposterGames: acc.imposterGames,
      crewWins: acc.crewWins,
      imposterWins: acc.imposterWins,
      timesVotedOut: acc.timesVotedOut,
      timesVotedFor: acc.timesVotedFor,
      winRate: ratePercent(acc.crewWins + acc.imposterWins, acc.gamesPlayed),
      crewWinRate: ratePercent(acc.crewWins, acc.crewGames),
      imposterWinRate: ratePercent(acc.imposterWins, acc.imposterGames),
      catchRate: ratePercent(acc.timesCaughtAsImposter, acc.imposterGames),
    }))
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed);
}