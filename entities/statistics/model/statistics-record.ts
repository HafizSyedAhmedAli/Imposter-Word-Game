// lib/statistics-record.ts
// Deep import (not the "@/features/play-round" barrel) deliberately:
// that barrel's `export *` re-exports every model file, including
// game-engine.ts, which instantiates its word providers as top-level
// module side effects. Importing the barrel here would force
// game-engine.ts to load as a side effect of loading THIS file, and
// since game-engine.ts's own dependency chain eventually reaches back
// into entities/statistics (via lib/db.ts's re-export bridge), that's
// a real runtime circular import -- observed as "IndexedDbCacheProvider
// is not a constructor" depending on which module happened to start
// the cycle first. final-results-flow.ts itself has no such side
// effects and no path back to game-engine.ts or entities/statistics,
// so importing it directly is safe.
import {
  getFinalPlayerResults,
  getFinalVotingHistory,
  getRoundSummary,
  type FinalOutcome,
} from "@/features/play-round/model/final-results-flow";
import { CompletedGamePlayerResult, CompletedGameRecord } from "./completed-game-store";
import { RoundSession } from "@/entities/round";

/**
 * The pure "Statistics Recorder" step of the pipeline described in the
 * Statistics feature spec:
 *
 *   Game Engine -> Completed Game Result -> Statistics Recorder ->
 *   Dexie -> Statistics Aggregator -> Statistics Screen
 *
 * This module is the "Statistics Recorder" -- it turns an already-
 * finished `RoundSession` + its already-determined `FinalOutcome` into
 * the storage-shaped `CompletedGameRecord` lib/db.ts persists. It never
 * decides who won, who's an imposter, or who was eliminated -- every
 * one of those facts is read from game/final-results-flow.ts, the same
 * module the Final Results screen itself renders from, so this can
 * never drift from what the player already saw on screen (see that
 * file's doc comment: there is exactly one source of truth for a
 * game's outcome, and it isn't this file).
 */

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Total votes this player received across every completed voting round
 * this game -- aggregate counts only, never who voted for whom. */
function getVotesReceived(session: RoundSession, playerId: string): number {
  const history = getFinalVotingHistory(session);
  return history.reduce((total, entry) => {
    const tallyEntry = entry.tally.find((t) => t.playerId === playerId);
    return total + (tallyEntry?.votes ?? 0);
  }, 0);
}

/**
 * Builds one finished game's local statistics record. Pure -- no
 * IndexedDB access, no side effects -- so it can be unit-tested against
 * plain session fixtures without touching Dexie at all (see
 * test/lib/statistics-record.test.ts).
 */
export function buildCompletedGameRecord(
  session: RoundSession,
  outcome: FinalOutcome,
): CompletedGameRecord {
  const results = getFinalPlayerResults(session);
  const summary = getRoundSummary(session);

  const players: CompletedGamePlayerResult[] = results.map((result) => ({
    playerId: result.player.id,
    name: result.player.name.trim(),
    normalizedName: normalizeName(result.player.name),
    role: result.role,
    eliminated: result.eliminated,
    votesReceived: getVotesReceived(session, result.player.id),
  }));

  const impostersCaught = results.filter(
    (result) => result.role === "imposter" && result.eliminated,
  ).length;

  return {
    id: session.id,
    completedAt: Date.now(),
    playerCount: summary.playerCount,
    imposterCount: summary.imposterCount,
    winner: outcome,
    roundsPlayed: session.round.number,
    category: session.config.category,
    difficulty: session.config.difficulty,
    mode: session.config.mode,
    impostersCaught,
    players,
  };
}