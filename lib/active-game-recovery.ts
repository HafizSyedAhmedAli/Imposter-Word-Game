import type { RoundSession } from "@/game/game-types";
import type { AppRoute } from "./app-routes";

const STORAGE_KEY = "iw:active-game-recovery";

// An unfinished game is only ever offered for recovery within this
// window. Anything older is treated as abandoned (spec: "expire after
// 24 hours").
const EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Only the screens that actually read/write a `RoundSession` -- i.e. the
 * in-round pipeline. Setup/Players (Screens 1-3) intentionally have no
 * `RoundSession` yet at that point (see game/game-types.ts), so there's
 * nothing for this mechanism to recover until Round Preparation has run.
 */
export type ActiveGameRoute = Extract<
  AppRoute,
  "/round" | "/pass" | "/game" | "/voting" | "/results"
>;

type ActiveGameRecoveryRecord = {
  session: RoundSession;
  route: ActiveGameRoute;
  savedAt: number; // epoch ms -- last time this record was touched
};

function isBrowser() {
  return typeof window !== "undefined";
}

function readRecord(): ActiveGameRecoveryRecord | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActiveGameRecoveryRecord) : null;
  } catch {
    return null;
  }
}

function writeRecord(record: ActiveGameRecoveryRecord): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Best-effort, same as round-session-store.ts -- an in-memory-only
    // session still works for this tab's lifetime, it just won't survive
    // a full app close.
  }
}

/**
 * Discards the "resumable game" record only. Never touches sessionStorage
 * (round-session-store.ts owns that), Dexie/IndexedDB (word cache,
 * settings), or any other localStorage key (statistics, custom words).
 */
export function clearActiveGameRecovery(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

/**
 * Called from round-session-store.storeRoundSession() every time the
 * round session changes -- mirrors it into localStorage, which (unlike
 * sessionStorage) survives the PWA/browser being fully closed. This is
 * what makes recovery possible after a real relaunch, not just a
 * refresh.
 *
 * A `status: "finished"` round is deliberately NOT mirrored -- a
 * completed game is not "in progress" and must never trigger the
 * recovery prompt (spec: "Completed games must NOT trigger 'Game in
 * Progress'").
 */
export function mirrorActiveGameSession(session: RoundSession): void {
  if (!isBrowser()) return;
  if (session.status === "finished") {
    clearActiveGameRecovery();
    return;
  }
  const existing = readRecord();
  writeRecord({
    session,
    // Preserve whatever screen was last explicitly marked (see
    // markActiveGameRoute below); only default to "/round" for a
    // brand-new record, since that's the only screen that can create
    // one from scratch (prepareGameRound()).
    route: existing?.route ?? "/round",
    savedAt: Date.now(),
  });
}

/**
 * Called once, on mount, by each in-round screen (Round Preparation,
 * Pass, Discussion, Voting, Results). `RoundSession.status` alone can't
 * tell Discussion and Voting apart -- both are `status: "playing"` --
 * so this is the only source of truth for exactly which screen a
 * "Resume Game" should return to.
 */
export function markActiveGameRoute(route: ActiveGameRoute): void {
  if (!isBrowser()) return;
  const existing = readRecord();
  if (!existing) return; // nothing stored yet to attach a route to
  writeRecord({ ...existing, route, savedAt: Date.now() });
}

/**
 * Reads back a recoverable game, if one exists. Deliberately checks
 * ONLY localStorage, never sessionStorage -- sessionStorage already
 * survives refreshes/minimize/lock/offline on its own (see
 * round-session-store.ts's doc comment); this function's whole purpose
 * is covering the one gap that doesn't: a full close + relaunch.
 */
export function getRecoverableActiveGame(): ActiveGameRecoveryRecord | null {
  const record = readRecord();
  if (!record) return null;

  if (record.session.status === "finished") {
    clearActiveGameRecovery();
    return null;
  }

  if (Date.now() - record.savedAt > EXPIRY_MS) {
    clearActiveGameRecovery();
    return null;
  }

  return record;
}
