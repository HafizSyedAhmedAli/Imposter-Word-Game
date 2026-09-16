import { resetUserData, clearCustomWords } from "./db";
import { resetStatistics } from "./game-statistics-store";
import { resetAchievements } from "./achievements/store";
import { resetSettings } from "./settings-store";
import { clearRecentWords } from "./recent-words";
import { clearStoredRoundSession } from "./round-session-store";

/**
 * The single entry point for "Reset Game Data" (Settings screen). Wipes
 * every piece of *user-generated/local* data across all persistence
 * layers this app uses:
 *
 *   - IndexedDB (lib/db.ts)                -- cached AI rounds
 *   - IndexedDB (lib/db.ts)                -- saved custom words
 *   - IndexedDB (lib/db.ts)                -- local statistics / game history
 *   - IndexedDB (lib/db.ts)                -- achievement unlock history
 *   - IndexedDB (lib/settings-store.ts)    -- saved Sound/Haptics prefs
 *   - sessionStorage (recent-words)        -- short-term repeat avoidance
 *   - sessionStorage (round-session-store) -- the in-progress round, if any
 *
 * Deliberately does NOT touch the built-in/static word library
 * (lib/fallback-words.ts) -- that's bundled application data, not
 * something a "reset my data" action should ever remove, and the game
 * must remain fully playable offline immediately afterwards.
 *
 * IndexedDB is cleared first (cached AI words, then custom words, then
 * statistics, then achievement unlocks) and is the only part that can
 * actually fail (quota/corruption/unavailable storage) -- if any of the
 * four throws, the remaining steps are skipped so the caller gets a
 * clean, unambiguous failure ("nothing was deleted") rather than a
 * partial reset. Statistics and achievement unlocks both live in Dexie
 * tables specifically so they can join this fail-fast group instead of
 * being a separate, always-succeeds step -- a reset that silently fails
 * to clear stored game/achievement history would leave a player's local
 * data wrong without ever telling them. Once past that point,
 * `resetSettings`/`clearRecentWords`/`clearStoredRoundSession` are
 * best-effort and never throw (see each module for details), so a
 * successful resolution here means the reset fully completed.
 *
 * Achievement *progress* (not just the unlock-history table) also
 * genuinely returns to zero after this: every achievement condition is
 * evaluated live from `completedGames` (see
 * lib/achievements/engine.ts), so once `resetStatistics()` clears that
 * table, every achievement re-evaluates as locked/0-progress on its own
 * -- `resetAchievements()` additionally clears the
 * `achievementUnlocks` table so no stale "already unlocked"/"unlocked
 * on" record lingers behind that emptied history (spec's "no stale
 * achievements remain").
 */
export async function resetGameData(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = performReset().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

// Module-level guard against duplicate concurrent resets (e.g. a
// double-tap before the button's own `disabled` state has committed).
// A second caller during an in-flight reset awaits the same promise
// rather than clearing the IndexedDB tables twice.
let inFlight: Promise<void> | null = null;

async function performReset(): Promise<void> {
  await resetUserData();
  await clearCustomWords();
  await resetStatistics();
  await resetAchievements();
  await resetSettings();
  clearRecentWords();
  clearStoredRoundSession();
}
