import { getDb } from "./db";
import type { GameLanguage } from "@/game/game-types";
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/game/game-rules";

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
  music: boolean;
  /**
   * The content language for future rounds (Settings: Language). Read
   * once by game/game-engine.ts when a round is prepared and then frozen
   * onto that round -- changing this mid-round never affects the round
   * already in progress. Defaults to "english" for backward
   * compatibility: every install/save that predates this feature must
   * keep behaving exactly as it did before (see getSettings() below).
   */
  language: GameLanguage;
};

export const DEFAULT_SETTINGS: GameSettings = {
  sound: true,
  haptics: true,
  music: true,
  language: DEFAULT_LANGUAGE,
};

const VALID_LANGUAGES = new Set(LANGUAGES.map((l) => l.id));

/**
 * Narrows an arbitrary stored value down to a known `GameLanguage`,
 * defaulting to English for anything else (missing field on an old row,
 * a future/unknown value, corrupted data, etc.) -- language is never
 * trusted blindly from storage, same principle as the server route never
 * trusting it blindly from the client (see app/api/round/generate/route.ts).
 */
function normalizeLanguage(value: unknown): GameLanguage {
  return typeof value === "string" && VALID_LANGUAGES.has(value as GameLanguage)
    ? (value as GameLanguage)
    : DEFAULT_LANGUAGE;
}

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
    return {
      sound: row.sound,
      haptics: row.haptics,
      // Older saved rows predate the music setting -- default it in
      // rather than letting a stale row silently disable music.
      music: row.music ?? DEFAULT_SETTINGS.music,
      // Same treatment for language -- rows saved before this feature
      // existed (or with an invalid value) always resolve to English.
      language: normalizeLanguage(row.language),
    };
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
      // `current`/`patch` may carry a raw/unnormalized `language` (e.g.
      // `current` comes straight off a SettingsRow, whose `language` is
      // typed as a defensive `string | undefined`) -- normalize it last
      // so `next` is always a genuine `GameLanguage`, never a bare
      // `string` that happens to satisfy the spread.
      language: normalizeLanguage(patch.language ?? current?.language),
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
