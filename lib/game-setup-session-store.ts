import type { GameConfig, Player } from "@/game/game-types";

const STORAGE_KEY = "iw:game-setup";

export type StoredGameSetup = {
  config: GameConfig;
  players: Player[];
};

/**
 * sessionStorage-backed persistence for the in-progress `GameConfig` +
 * `players` list (Setup -> Players -> Round). This mirrors
 * lib/round-session-store.ts exactly, and exists for the same reason a
 * hard refresh needs to survive: an offline navigation between /setup,
 * /players and /round has to be a full document navigation (see
 * lib/offline-navigation.ts), which remounts GameSetupProvider from
 * scratch. Without this, that remount would silently reset the config
 * and wipe out whatever players had already been typed in.
 *
 * `sessionStorage` (not `localStorage`) is deliberate here for the same
 * reason as the round session: scoped to this tab/game, gone when the
 * tab closes -- this was already the *effective* lifetime of the
 * in-memory-only state it replaces, since nothing previously called
 * resetConfig()/resetPlayers() to clear it early.
 */
export function getStoredGameSetup(): StoredGameSetup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredGameSetup) : null;
  } catch {
    return null;
  }
}

export function storeGameSetup(setup: StoredGameSetup): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(setup));
  } catch {
    // Best-effort -- in-memory state still works for the current page's
    // lifetime, it just won't survive a refresh/full navigation.
  }
}
