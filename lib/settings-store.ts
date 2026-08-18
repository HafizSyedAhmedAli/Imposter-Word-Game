import { getDb } from "./db";

/**
 * Device-local preferences shown on the Settings screen. Backed by the
 * `settings` Dexie table (lib/db.ts, v4) so they persist across
 * refreshes, browser restarts, and installed-PWA relaunches the same
 * way cached AI words do -- deliberately NOT localStorage, to keep a
 * single persistence layer for anything that needs to survive an
 * offline install (see game-statistics-store.ts's localStorage choice
 * for *lifetime stats*, which is a separate, pre-existing tradeoff this
 * file doesn't change).
 */
export type GameSettings = {
  sound: boolean;
  haptics: boolean;
};

export const DEFAULT_SETTINGS: GameSettings = {
  sound: true,
  haptics: true,
};

// Single fixed row -- this app has no concept of multiple local
// profiles, so there's nothing to key preferences by.
const SETTINGS_ID = "app";

/**
 * Reads the current settings, falling back to defaults if nothing has
 * been saved yet (fresh install) or if IndexedDB is unavailable for any
 * reason. Never rejects -- a settings read must never block rendering
 * the Settings screen.
 */
export async function getSettings(): Promise<GameSettings> {
  try {
    const db = getDb();
    const row = await db.settings.get(SETTINGS_ID);
    if (!row) return DEFAULT_SETTINGS;
    return { sound: row.sound, haptics: row.haptics };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Merges `patch` into the saved settings and persists the result.
 * Reads-then-writes the full row (Dexie `put` replaces the whole
 * record) so toggling one field never clobbers the other.
 */
export async function updateSettings(
  patch: Partial<GameSettings>,
): Promise<GameSettings> {
  const db = getDb();
  return db.transaction("rw", db.settings, async () => {
    const current = await db.settings.get(SETTINGS_ID);
    const next: GameSettings = {
      ...DEFAULT_SETTINGS,
      ...current,
      ...patch,
    };
    await db.settings.put({ id: SETTINGS_ID, ...next });
    return next;
  });
}

/**
 * Clears the saved row so settings fall back to defaults. Part of
 * "Reset Game Data" (see lib/reset-game-data.ts) -- best-effort and
 * silent like the other reset steps in that file, since a failed clear
 * here shouldn't be reported as the whole reset having failed.
 */
export async function resetSettings(): Promise<void> {
  try {
    const db = getDb();
    await db.settings.delete(SETTINGS_ID);
  } catch {
    // Best-effort -- see doc comment above.
  }
}