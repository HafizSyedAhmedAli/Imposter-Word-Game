// lib/game-setup-store.ts
import type { GameConfig, Player } from "@/game/game-types";

const STORAGE_KEY = "iw:game-setup";

export type StoredGameSetup = {
  config: GameConfig;
  players: Player[];
};

/**
 * Session-storage-backed persistence for the in-progress GameConfig +
 * Player list (Screens 2-3). This exists purely as a safety net for
 * GameSetupProvider's in-memory state (lib/game-setup-context.tsx) --
 * that provider is the source of truth during normal client-side
 * navigation and updates this on every change.
 *
 * Why this is needed even though GameSetupProvider is mounted once at
 * the root layout: when offline, a client-side route transition (e.g.
 * /players -> /round) can fail to fetch its RSC payload and fall back
 * to a hard browser navigation. That remounts the entire React tree,
 * including GameSetupProvider, which would otherwise reset `players`
 * back to `[]` -- producing a false "Let's set up the players first"
 * on Screen 4 immediately after a person just finished adding players.
 * Hydrating from here on mount recovers the real list instead.
 *
 * `sessionStorage` (not `localStorage`), matching round-session-store.ts:
 * scoped to this tab/game only, and it's fine for it to disappear once
 * the game (or tab) is closed -- there's no "resume setup tomorrow"
 * requirement here.
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
    // Best-effort -- see doc comment above; a failed write just means
    // this safety net isn't there for THIS change, not a hard failure.
  }
}

export function clearStoredGameSetup(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
