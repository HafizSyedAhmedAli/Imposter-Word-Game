import { resetUserData } from "./db";
import { resetStatistics } from "./game-statistics-store";
import { resetSettings } from "./settings-store";
import { clearRecentWords } from "./recent-words";
import { clearStoredRoundSession } from "./round-session-store";

/**
 * The single entry point for "Reset Game Data" (Settings screen). Wipes
 * every piece of *user-generated/local* data across all five persistence
 * layers this app uses:
 *
 *   - IndexedDB (lib/db.ts)               -- cached AI rounds
 *   - IndexedDB (lib/settings-store.ts)   -- saved Sound/Haptics prefs
 *   - localStorage (game-statistics-store) -- lifetime stats + dedupe list
 *   - sessionStorage (recent-words)        -- short-term repeat avoidance
 *   - sessionStorage (round-session-store) -- the in-progress round, if any
 *
 * Deliberately does NOT touch the built-in/static word library
 * (lib/fallback-words.ts) -- that's bundled application data, not
 * something a "reset my data" action should ever remove, and the game
 * must remain fully playable offline immediately afterwards.
 *
 * IndexedDB is cleared first and is the only step that can actually
 * fail (quota/corruption/unavailable storage) -- if it throws, the
 * localStorage/sessionStorage cleanup steps are skipped so the caller
 * gets a clean, unambiguous failure ("nothing was deleted") rather than
 * a partial reset. Once past that point the remaining steps are
 * best-effort and never throw (see each module for details), so a
 * successful resolution here means the reset fully completed.
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
// rather than clearing the IndexedDB table twice.
let inFlight: Promise<void> | null = null;

async function performReset(): Promise<void> {
  await resetUserData();
  resetStatistics();
  await resetSettings();
  clearRecentWords();
  clearStoredRoundSession();
}
