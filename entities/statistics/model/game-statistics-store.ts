// entities/statistics/model/game-statistics-store.ts
import type { RoundSession } from "@/entities/round";
import type { FinalOutcome } from "@/features/play-round";
import {
  clearCompletedGames,
  getCompletedGames,
  recordCompletedGame,
  type CompletedGameRecord,
} from "./completed-game-store";
import { buildCompletedGameRecord } from "./statistics-record";
import {
  computeGlobalStatistics,
  computePlayerStatistics,
  type GlobalStatistics,
  type PlayerStatistics,
} from "./statistics-aggregation";

/**
 * Public entry point for the Statistics feature's persistence layer --
 * the "Statistics Recorder" + read side of the pipeline:
 *
 *   Game Engine -> Completed Game Result -> Statistics Recorder ->
 *   Dexie -> Statistics Aggregator -> Statistics Screen
 *
 * Backed by the `completedGames` Dexie table (lib/db.ts, v7) -- NOT
 * localStorage. Every finished game is stored as its own row, primary-
 * keyed by `session.id`. Because `recordCompletedGame` is a Dexie `put`
 * against that key, recording the same finished game twice (a refresh
 * of the Final Results screen, React Strict Mode's double-invoke)
 * simply overwrites the row with identical data instead of creating a
 * duplicate -- there's no separate "already finalized" id list to keep
 * in sync, and no risk of double-counting, since every number the
 * Statistics screen shows (see lib/statistics-aggregation.ts) is
 * computed fresh from the row set rather than accumulated in place.
 *
 * This module deliberately contains no win-condition or role logic of
 * its own -- see lib/statistics-record.ts, which builds each row purely
 * from game/final-results-flow.ts's already-determined outcome.
 */

/**
 * Rolls one finished game into local statistics. Called once, from
 * FinalResultsScreen.tsx's completion effect, the same idempotency-
 * guarded call site that also fires `analytics.gameCompleted` -- see
 * that component for the guard against calling this more than once per
 * rendered session. Deliberately not awaited by its caller (this
 * function swallows and reports its own failures internally, the same
 * way lib/db.ts's `recordCompletedGame` and `cacheAiWord` do): a failed
 * write must never block or error a screen whose game is already over.
 */
export async function recordFinalResult(
  session: RoundSession,
  outcome: FinalOutcome,
): Promise<void> {
  const record = buildCompletedGameRecord(session, outcome);
  await recordCompletedGame(record);
}

/** Every completed game stored locally, oldest first -- the raw rows
 * behind the Statistics screen's aggregates and (if ever needed) a
 * future per-game history view. */
export async function getGameHistory(): Promise<CompletedGameRecord[]> {
  return getCompletedGames();
}

/**
 * Loads and aggregates both the global and per-player statistics in one
 * pass, since the Statistics screen always needs both together and a
 * single `getCompletedGames()` read is enough to derive either.
 */
export async function getStatisticsSnapshot(): Promise<{
  global: GlobalStatistics;
  players: PlayerStatistics[];
}> {
  const games = await getGameHistory();
  return {
    global: computeGlobalStatistics(games),
    players: computePlayerStatistics(games),
  };
}

/**
 * Clears every stored completed-game record. Part of "Reset Game Data"
 * (see lib/reset-game-data.ts) -- rethrows on failure, same as
 * `resetUserData`/`clearCustomWords`, since a user-initiated reset must
 * report failure rather than silently leaving stale statistics behind.
 */
export async function resetStatistics(): Promise<void> {
  await clearCompletedGames();
}
