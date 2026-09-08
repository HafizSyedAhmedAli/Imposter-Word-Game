// lib/monitoring.ts
import type {
  Category,
  Difficulty,
  GameLanguage,
  GameMode,
  RoundContentSource,
} from "@/game/game-types";

/**
 * Thin, privacy-conscious wrapper around Sentry. This module is the ONLY
 * place `@sentry/nextjs` is referenced from outside the
 * `instrumentation*`/`sentry.*.config.ts` init files -- every call site
 * elsewhere goes through the helpers below instead of importing
 * `@sentry/nextjs` directly (same convention as `lib/analytics.ts` for
 * PostHog).
 *
 * `@sentry/nextjs` is loaded via a dynamic `import()` rather than a
 * static top-level import, and always inside a try/catch. Two reasons:
 *  1. Runtime resolution: this module runs in both the browser and
 *     Node.js. A static import resolves to a single build target at
 *     bundle time; the dynamic import lets Next.js's bundler pick the
 *     right build (browser/server) for whichever environment actually
 *     calls it, and lets it tree-shake this file out of the Capacitor
 *     static-export bundle's paths that never call it.
 *  2. Never block or fail gameplay: if the import fails for any reason
 *     (blocked script, an environment -- like the Vitest test runner --
 *     that can't resolve the package's instrumentation hooks, or Sentry
 *     simply not being configured), every helper below degrades to a
 *     silent no-op instead of throwing. Vendor-abstraction is the whole
 *     point of this file, same as `lib/analytics.ts`'s `safeTrack`.
 *
 * Additional hard rule:
 *  - NEVER send secret game content (the round's word/hint), player
 *    names, or votes tied to identifiable players. Only the coarse,
 *    aggregate fields explicitly listed below are ever attached.
 */

async function getSentry(): Promise<typeof import("@sentry/nextjs") | null> {
  try {
    return await import("@sentry/nextjs");
  } catch {
    return null;
  }
}

/** Keys that must never reach Sentry, scrubbed defensively even though
 * no call site below ever passes them -- a last line of defense in case
 * a future edit adds one by mistake. */
const SENSITIVE_KEYS = new Set([
  "word",
  "hint",
  "secretword",
  "playername",
  "playernames",
  "players",
  "name",
  "votes",
  "vote",
]);

function scrub<T extends Record<string, unknown>>(data: T): T {
  const clean = { ...data };
  for (const key of Object.keys(clean)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      delete (clean as Record<string, unknown>)[key];
    }
  }
  return clean;
}

/**
 * Safe, privacy-scrubbed technical context about the game in progress.
 * Deliberately mirrors the STEP 8 example in the spec -- coarse shape
 * only, never anything that could expose the round's answer or identify
 * a specific player.
 */
export type GameContext = {
  mode?: GameMode;
  category?: Category;
  difficulty?: Difficulty;
  playerCount?: number;
  imposterCount?: number;
  phase?: string;
  roundSource?: RoundContentSource;
  language?: GameLanguage;
  online?: boolean;
};

/**
 * Merges safe fields into the "game" context attached to future Sentry
 * events. Called from natural game-state transition points (see
 * components/round/RoundPreparationScreen.tsx) -- never introduces a new
 * state-tracking mechanism, just mirrors state that already exists.
 */
export function setGameContext(context: GameContext): void {
  void (async () => {
    const Sentry = await getSentry();
    if (!Sentry) return;
    try {
      Sentry.setContext("game", scrub(context));
    } catch {
      // Intentionally ignored -- see this file's module doc comment.
    }
  })();
}

/**
 * Lightweight breadcrumb for an important, privacy-safe application
 * event (STEP 9's list: game started, round created, voting started,
 * etc.). `data` goes through the same scrub as setGameContext.
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
): void {
  void (async () => {
    const Sentry = await getSentry();
    if (!Sentry) return;
    try {
      Sentry.addBreadcrumb({
        category: "game",
        message,
        level: "info",
        data: data ? scrub(data) : undefined,
      });
    } catch {
      // Intentionally ignored -- see this file's module doc comment.
    }
  })();
}

/**
 * Reports a genuine, unexpected application error -- NOT an expected
 * fallback (e.g. AI generation failing and the game continuing via the
 * local word provider is normal resilience behavior and must never be
 * reported here; see game/game-engine.ts's `getRoundContent`).
 *
 * `context` is scrubbed the same way as `setGameContext`/`addBreadcrumb`.
 * The error's own `message`/`stack` are sent as-is by Sentry's default
 * exception capture -- callers must not put secret game content (the
 * word/hint) into an Error's message.
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  void (async () => {
    const Sentry = await getSentry();
    if (!Sentry) return;
    try {
      Sentry.captureException(error, {
        contexts: context ? { game: scrub(context) } : undefined,
      });
    } catch {
      // Intentionally ignored -- see this file's module doc comment.
    }
  })();
}