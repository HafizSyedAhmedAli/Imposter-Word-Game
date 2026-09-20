// entities/achievement/model/achievement-store.ts
import type { RoundSession } from "@/entities/round";
import { getGameHistory } from "@/entities/statistics";
import { captureError } from "@/lib/monitoring";
import type { AchievementDefinition } from "./achievement-definitions";
import {
  buildAchievementPlayerContexts,
  evaluateAchievementsForPlayer,
  type AchievementPlayerContext,
} from "./achievement-engine";
import type { AchievementUnlockRecord } from "./achievement-types";
import {
  clearAchievementUnlocks,
  getAchievementUnlocks,
  recordAchievementUnlock,
} from "./achievement-unlock-db";

/**
 * NOTE on the imports above: `getGameHistory`
 * (lib/game-statistics-store.ts) belongs to the planned
 * `entities/statistics` slice and `captureError` (lib/monitoring.ts)
 * stays put until `shared/` can take it -- see ../../README.md.
 * Deliberate, temporary bridges. `RoundSession` comes straight from
 * `entities/round`'s public API.
 */

/**
 * Public entry point for the Achievements feature's persistence layer --
 * mirrors lib/game-statistics-store.ts's role for Statistics. Backed by
 * the `achievementUnlocks` Dexie table (declared in lib/db.ts, v8; read
 * and written through ./achievement-unlock-db.ts).
 *
 * IMPORTANT: unlock *state* is never sourced from this table alone --
 * see `AchievementUnlockRecord`'s doc comment in
 * ./achievement-types.ts. It always comes from re-evaluating
 * `completedGames` live (via ./achievement-engine.ts). This table only
 * remembers *when* each achievement was first earned, and lets this
 * module tell which achievements are genuinely new after one specific
 * game.
 */

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export type UnlockedAchievementEvent = {
  achievement: AchievementDefinition;
  normalizedName: string;
  displayName: string;
};

/**
 * Evaluates achievements for every player in a just-finished game and
 * persists any newly-earned unlocks. Called once from
 * FinalResultsScreen.tsx's completion effect, AFTER
 * `recordFinalResult` has already written this game to
 * `completedGames` -- so `getGameHistory()` here already includes it
 * (spec section 13's pipeline: Completed Game -> Statistics ->
 * Achievement Evaluation).
 *
 * Returns only the achievements that were NOT already unlocked for
 * that player before this call -- what the Final Results screen queues
 * as unlock notifications. Never returns duplicates, and never
 * re-reports an achievement already unlocked in an earlier game (spec
 * section 6/11's "unlocked only once" / "not appear repeatedly").
 *
 * Best-effort and silent, same reasoning as `recordFinalResult`
 * (lib/game-statistics-store.ts): this always runs after the game is
 * already fully decided and shown, so a failure here (a read/write
 * error) must never block or error the Final Results screen -- it
 * simply means no unlock notification fires for this particular game;
 * the achievement itself is never lost, since it will correctly show
 * as unlocked the next time anything reads live from `completedGames`.
 */
export async function processAchievementsForCompletedGame(
  session: RoundSession,
): Promise<UnlockedAchievementEvent[]> {
  try {
    const [games, existingUnlocks] = await Promise.all([
      getGameHistory(),
      getAchievementUnlocks(),
    ]);

    const alreadyUnlockedIds = new Set(existingUnlocks.map((u) => u.id));
    const contexts = buildAchievementPlayerContexts(games);

    const newlyUnlocked: UnlockedAchievementEvent[] = [];

    for (const player of session.players) {
      const normalizedName = normalizeName(player.name);
      const ctx = contexts.get(normalizedName);
      if (!ctx) continue; // Defensive -- every session player has a row in `games` by now.

      for (const state of evaluateAchievementsForPlayer(ctx)) {
        if (!state.unlocked) continue;
        const recordId = `${normalizedName}::${state.definition.id}`;
        if (alreadyUnlockedIds.has(recordId)) continue;

        newlyUnlocked.push({
          achievement: state.definition,
          normalizedName,
          displayName: ctx.displayName,
        });
      }
    }

    if (newlyUnlocked.length > 0) {
      const unlockedAt = Date.now();
      const records: AchievementUnlockRecord[] = newlyUnlocked.map((event) => ({
        id: `${event.normalizedName}::${event.achievement.id}`,
        achievementId: event.achievement.id,
        normalizedName: event.normalizedName,
        displayName: event.displayName,
        unlockedAt,
      }));
      // Fire in parallel -- each is its own best-effort, idempotent
      // `put` (see recordAchievementUnlock), so one failing never
      // blocks the others.
      await Promise.all(
        records.map((record) => recordAchievementUnlock(record)),
      );
    }

    return newlyUnlocked;
  } catch (error) {
    captureError(error, { phase: "process-achievements" });
    return [];
  }
}

export type AchievementsSnapshot = {
  /** Every local player who has completed at least one game, in the
   * same "most games played first" order as
   * lib/statistics-aggregation.ts's `computePlayerStatistics`. */
  players: AchievementPlayerContext[];
  /** `${normalizedName}::${achievementId}` -> unlock record, for
   * showing an "unlocked on" date on the Achievements screen. Absence
   * of an entry never means "locked" -- see this module's doc comment;
   * the screen determines locked/unlocked from `players` above. */
  unlocksById: Map<string, AchievementUnlockRecord>;
};

/**
 * Loads everything the Achievements screen needs in one pass: every
 * local player's evaluation context (live, derived from
 * `completedGames`) plus the persisted unlock timestamps used only for
 * display. A single `getGameHistory()` read is enough to derive the
 * player list the same way StatisticsScreen does.
 */
export async function getAchievementsSnapshot(): Promise<AchievementsSnapshot> {
  const [games, unlocks] = await Promise.all([
    getGameHistory(),
    getAchievementUnlocks(),
  ]);

  const contexts = buildAchievementPlayerContexts(games);
  const players = Array.from(contexts.values()).sort(
    (a, b) => b.stats.gamesPlayed - a.stats.gamesPlayed,
  );

  const unlocksById = new Map(unlocks.map((u) => [u.id, u]));

  return { players, unlocksById };
}

/**
 * Clears every stored achievement unlock. Part of "Reset Game Data"
 * (see features/reset-game-data/model/reset-game-data.ts) -- rethrows on failure, same as
 * `resetStatistics`, since a user-initiated reset must report failure
 * rather than silently leaving stale unlock history behind.
 */
export async function resetAchievements(): Promise<void> {
  await clearAchievementUnlocks();
}