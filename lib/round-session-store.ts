import type { RoundSession } from "@/game/game-types";

const STORAGE_KEY = "iw:round-session";

/**
 * Session-storage-backed persistence for the prepared round. This is what
 * makes /round (and later /pass) idempotent across a refresh -- a round
 * is only ever generated once (see components/round/RoundPreparationScreen.tsx
 * and Screen 4 spec sections 35-36).
 *
 * `sessionStorage` (not `localStorage`) is deliberate: it's scoped to
 * this tab/game only and clears itself when the game is closed, which
 * matches "one round in progress at a time" for a pass-the-phone game.
 */
export function getStoredRoundSession(): RoundSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RoundSession) : null;
  } catch {
    return null;
  }
}

export function storeRoundSession(session: RoundSession): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Best-effort -- an in-memory session (component state) still works
    // for the current page's lifetime, it just won't survive a refresh.
  }
}

export function clearStoredRoundSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
