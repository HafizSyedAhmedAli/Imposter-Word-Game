// entities/achievement/model/achievement-unlock-db.ts
import { getDb } from "@/lib/db";
import { captureError } from "@/lib/monitoring";
import type { AchievementUnlockRecord } from "./achievement-types";

/**
 * NOTE on the imports above: `@/lib/db` (`getDb` -- the Dexie instance
 * and its `achievementUnlocks` table schema stay put until `lib/db.ts`
 * itself moves, see ../../../shared/README.md) and `@/lib/monitoring`
 * are the pre-FSD locations. Deliberate, temporary bridges. `lib/db.ts`
 * in turn re-exports the functions below so its existing consumers keep
 * working -- see ../../README.md.
 */

/* -------------------------------------------------------------------- */
/* Achievements (Home -> Achievements)                                   */
/*                                                                        */
/* CRUD for locally-stored achievement unlock records. Moved here from   */
/* lib/db.ts; the Dexie table they read and write is still declared      */
/* there. Like the Statistics section in that file, this module never    */
/* decides whether an achievement is earned -- see ./achievement-engine  */
/* (pure evaluation from `completedGames`) and ./achievement-store       */
/* (orchestrates evaluation + persists newly-earned unlocks). This file  */
/* only persists/reads/clears rows.                                      */
/* -------------------------------------------------------------------- */

/**
 * Saves one (player, achievement) unlock. A plain Dexie `put` against
 * the primary key (`record.id` = `${normalizedName}::${achievementId}`)
 * -- recording the same unlock twice is a no-op overwrite, same
 * reasoning as `recordCompletedGame` in lib/db.ts.
 *
 * Best-effort and silent, same reasoning as `recordCompletedGame`: this
 * always runs after a game is already fully decided and (usually) after
 * the Final Results screen has already shown an unlock notification for
 * it -- a failed write must never surface an error on a screen whose
 * game is already over. Because achievement *state* is always
 * recomputed live from `completedGames` (see this table's doc comment
 * on `AchievementUnlockRecord`), a failed write here only means a
 * missing "unlocked on" timestamp and a possible repeat notification
 * next time -- never a real achievement silently failing to unlock.
 */
export async function recordAchievementUnlock(
  record: AchievementUnlockRecord,
): Promise<void> {
  try {
    const db = getDb();
    await db.achievementUnlocks.put(record);
  } catch (error) {
    captureError(error, { phase: "record-achievement-unlock" });
  }
}

/** Every locally-stored achievement unlock, across every local player. */
export async function getAchievementUnlocks(): Promise
  AchievementUnlockRecord[]
> {
  const db = getDb();
  return db.achievementUnlocks.toArray();
}

/** One local player's unlock history, keyed the same way
 * `computePlayerStatistics` groups players (trimmed, lowercased name). */
export async function getAchievementUnlocksForPlayer(
  normalizedName: string,
): Promise<AchievementUnlockRecord[]> {
  const db = getDb();
  return db.achievementUnlocks
    .where("normalizedName")
    .equals(normalizedName)
    .toArray();
}

/**
 * Deletes every stored achievement unlock -- the Achievements half of
 * "Reset Game Data" (see lib/reset-game-data.ts). Rethrows on failure,
 * same as `clearCompletedGames` in lib/db.ts: a user-initiated reset
 * must report failure rather than silently leaving stale unlock history
 * (and stale "already notified" state) behind.
 */
export async function clearAchievementUnlocks(): Promise<void> {
  const db = getDb();
  await db.achievementUnlocks.clear();
}