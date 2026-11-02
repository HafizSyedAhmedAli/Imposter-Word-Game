// entities/statistics/model/completed-game-store.ts
import type { Category, Difficulty, GameMode } from "@/game/game-types";
import { getDb } from "@/lib/db";
import { captureError } from "@/lib/monitoring";

/**
 * NOTE: this file, `CompletedGameRecord`, `CompletedGamePlayerResult`, and
 * the CRUD below all lived in `lib/db.ts` until this move -- see
 * entities/README.md. The `completedGames` Dexie table declaration itself
 * (schema versions + migrations) stays in `lib/db.ts` alongside every
 * other table, the same reasoning `entities/custom-word` already
 * documented for `customWords`: it moves when `lib/db.ts` itself does
 * (planned `shared/api/db`). `getDb` is imported from there.
 *
 * `Category`/`Difficulty`/`GameMode` are a temporary bridge to
 * `@/game/game-types`, same as every other entity slice that hasn't had
 * those types assigned a home yet (see entities/README.md's
 * `entities/word` entry for why).
 */

/**
 * One player's public, post-game result within a single completed game
 * (Statistics feature). Deliberately does NOT carry the round's secret
 * word/hint -- only what the Final Results screen already reveals to
 * everyone (see game/final-results-flow.ts's `getFinalPlayerResults`).
 * `playerId` is only unique *within* one game (see entities/player's
 * `Player.id`, a fresh `generateId()` per game) -- cross-game player
 * matching for lifetime per-player statistics is done by
 * `normalizedName`, never `playerId`.
 */
export type CompletedGamePlayerResult = {
  playerId: string;
  name: string;
  normalizedName: string;
  role: "player" | "imposter";
  eliminated: boolean;
  votesReceived: number;
};

/**
 * One finished game's local, offline-only summary (Statistics feature).
 * Primary-keyed by `id` = the originating `RoundSession.id` -- the same
 * id that's stable for the lifetime of one game across every
 * `continueRound` call (see entities/round). This is what makes
 * recording a finished game naturally idempotent: writing the same
 * game's record twice (a refresh of the Final Results screen, React
 * Strict Mode's double-invoke) is a Dexie `put` against the same key,
 * which overwrites in place rather than creating a duplicate row -- see
 * `recordCompletedGame` below. No separate "already recorded" list is
 * needed as a result.
 *
 * Deliberately stores one row per completed game (not a running lifetime
 * counter) so per-player statistics, future achievements, and local
 * leaderboards can all be derived later from this same table without a
 * schema change -- see ./statistics-aggregation.ts, which is the only
 * thing that turns these rows into the numbers the Statistics screen
 * shows.
 */
export type CompletedGameRecord = {
  id: string;
  completedAt: number;
  playerCount: number;
  imposterCount: number;
  winner: "crew-win" | "imposter-win";
  roundsPlayed: number;
  category: Category;
  difficulty: Difficulty;
  mode: GameMode;
  impostersCaught: number;
  players: CompletedGamePlayerResult[];
};

export async function recordCompletedGame(
  record: CompletedGameRecord,
): Promise<void> {
  try {
    const db = getDb();
    await db.completedGames.put(record);
  } catch (error) {
    captureError(error, { phase: "record-completed-game" });
  }
}

export async function getCompletedGames(): Promise<CompletedGameRecord[]> {
  const db = getDb();
  return db.completedGames.orderBy("completedAt").toArray();
}

export async function clearCompletedGames(): Promise<void> {
  const db = getDb();
  await db.completedGames.clear();
}
