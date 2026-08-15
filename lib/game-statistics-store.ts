// lib/game-statistics-store.ts
import type { RoundSession } from "@/game/game-types";
import type { FinalOutcome } from "@/game/final-results-flow";
import { getEliminatedPlayerIds } from "@/game/elimination";

/**
 * Lifetime game statistics (spec's "STATISTICS"), backed by
 * `localStorage` -- deliberately NOT `sessionStorage` like
 * round-session-store.ts, because these must survive across games, tab
 * closes, and app restarts (spec: do not clear "game statistics" when a
 * new round starts). Mirrors the get/store/best-effort-catch shape of
 * round-session-store.ts for consistency with the rest of the codebase.
 */

const STATS_KEY = "iw:statistics";
const FINALIZED_ROUNDS_KEY = "iw:finalized-round-ids";

// Bounds the finalized-round-id list so it can't grow forever across a
// long-lived install -- far more than anyone plays in one sitting, which
// is the only window a duplicate finalize (a refresh of Screen 9) could
// actually happen in.
const MAX_TRACKED_ROUND_IDS = 200;

export type GameStatistics = {
  gamesPlayed: number;
  crewWins: number;
  imposterWins: number;
  impostersCaught: number;
  totalImpostersRevealed: number;
};

const EMPTY_STATISTICS: GameStatistics = {
  gamesPlayed: 0,
  crewWins: 0,
  imposterWins: 0,
  impostersCaught: 0,
  totalImpostersRevealed: 0,
};

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort, same as round-session-store.ts -- a failed write just
    // means this one game's stats don't persist, nothing else breaks.
  }
}

export function getStatistics(): GameStatistics {
  return { ...EMPTY_STATISTICS, ...readJSON(STATS_KEY, EMPTY_STATISTICS) };
}

// lib/game-statistics-store.ts (insert after getStatistics)

/**
 * Clears lifetime statistics and the finalized-round-id dedupe list.
 * Part of "Reset Game Data" (see lib/reset-game-data.ts) -- both keys
 * are localStorage-backed, so unlike the IndexedDB AI cache they can't
 * meaningfully fail to clear; this mirrors the best-effort shape of the
 * rest of this file rather than throwing.
 */
export function resetStatistics(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(FINALIZED_ROUNDS_KEY);
  } catch {
    // Best-effort, same as writeJSON above.
  }
}

function hasBeenFinalized(roundId: string): boolean {
  return readJSON<string[]>(FINALIZED_ROUNDS_KEY, []).includes(roundId);
}

function markFinalized(roundId: string): void {
  const ids = readJSON<string[]>(FINALIZED_ROUNDS_KEY, []);
  if (ids.includes(roundId)) return;
  writeJSON(
    FINALIZED_ROUNDS_KEY,
    [...ids, roundId].slice(-MAX_TRACKED_ROUND_IDS),
  );
}

/**
 * Rolls one finished game's outcome into the running lifetime totals.
 * Idempotent per `session.id` -- calling this again for the same round
 * (a refresh of the Final Results screen, or React Strict Mode's
 * double-invoke) is a guaranteed no-op, so a game is never double
 * counted (spec: "A refresh of Screen 9 must NOT increment statistics
 * again"). `session.id` is stable for the lifetime of one game (it
 * survives every `continueRound` call) and only changes when a genuinely
 * new round is prepared, which is exactly the granularity "games played"
 * needs.
 */
export function recordFinalResult(
  session: RoundSession,
  outcome: FinalOutcome,
): GameStatistics {
  if (hasBeenFinalized(session.id)) return getStatistics();

  const totalImposters = session.round.roles.filter(
    (r) => r.role === "imposter",
  ).length;
  const eliminated = new Set(getEliminatedPlayerIds(session));
  const impostersCaught = session.round.roles.filter(
    (r) => r.role === "imposter" && eliminated.has(r.playerId),
  ).length;

  const current = getStatistics();
  const next: GameStatistics = {
    gamesPlayed: current.gamesPlayed + 1,
    crewWins: current.crewWins + (outcome === "crew-win" ? 1 : 0),
    imposterWins: current.imposterWins + (outcome === "imposter-win" ? 1 : 0),
    impostersCaught: current.impostersCaught + impostersCaught,
    totalImpostersRevealed: current.totalImpostersRevealed + totalImposters,
  };

  writeJSON(STATS_KEY, next);
  markFinalized(session.id);
  return next;
}
