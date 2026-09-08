// lib/analytics.ts
import posthog from "posthog-js";
import type {
  Category,
  Difficulty,
  GameMode,
  RoundContentSource,
} from "@/game/game-types";
import type { FinalOutcome } from "@/game/final-results-flow";
import { addBreadcrumb } from "@/lib/monitoring";

/**
 * Lightweight, privacy-conscious product analytics (PostHog). This
 * module is the ONLY place `posthog.capture()` is called from -- every
 * call site elsewhere in the app goes through the typed helpers below
 * instead of importing `posthog-js` directly.
 *
 * Hard rules this file exists to enforce:
 *  - NEVER block or fail gameplay. Every helper swallows its own errors
 *    (see `safeTrack`) so a broken/blocked analytics script can never
 *    surface as a bug to a player.
 *  - NEVER send secret game content (words, hints, guesses, player
 *    names) or any personally-identifying data. Only coarse, aggregate
 *    properties listed on each helper below are ever sent.
 */

/**
 * Reuses the game engine's own `RoundContentSource` ("ai" | "cache" |
 * "fallback") as the single source of truth for which tier actually
 * served a round -- see game/game-engine.ts. `RoundSource` is the
 * analytics-facing vocabulary for the same concept: it additionally
 * allows `"custom"` for a future user-authored-content provider (none
 * exists in this codebase today, see providers/word-provider.ts), and
 * spells the cache tier as `"cached-ai"` to read clearly on a dashboard.
 */
export type RoundSource = "ai" | "builtin" | "cached-ai" | "custom";

/** Maps the engine's internal `RoundContentSource` to the analytics vocabulary. */
export function toRoundSource(source: RoundContentSource): RoundSource {
  switch (source) {
    case "ai":
      return "ai";
    case "cache":
      return "cached-ai";
    case "fallback":
      return "builtin";
  }
}

/** `crew-win` / `imposter-win` (see game/final-results-flow.ts) as a dashboard-friendly winner label. */
function toWinner(outcome: FinalOutcome): "crew" | "imposters" {
  return outcome === "crew-win" ? "crew" : "imposters";
}

// Lets analytics be silenced during local development without touching
// the production deploy -- opt-in only (unset/anything other than
// "false" stays enabled), so no env setup is required for this to work
// correctly once deployed. See spec section 20.
const analyticsEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false";

/**
 * Wraps every `posthog.capture()` call so a thrown error (an ad
 * blocker, a network failure, or PostHog not having initialized yet --
 * see lib/posthog-provider.tsx) can never propagate into gameplay code.
 * Analytics is best-effort, always.
 */
function safeTrack(
  name: string,
  properties?: Record<string, string | number | boolean | null>,
): void {
  // Every one of this file's helpers already fires at exactly the game
  // lifecycle moments Sentry error monitoring wants breadcrumbs for
  // (game started, round started, AI fallback, etc. -- see each
  // helper's doc comment), and `properties` here is already the same
  // privacy-scrubbed shape sent to PostHog (never the secret word/hint
  // or a player's name). Piggybacking the Sentry breadcrumb on this
  // single choke point, rather than adding a second call at every site
  // that calls into `analytics`, keeps the two vendors' instrumentation
  // from drifting apart. This runs independently of the PostHog-specific
  // gates below -- breadcrumbs are crash-diagnostic context, not
  // opt-out-able product analytics (see `NEXT_PUBLIC_ANALYTICS_ENABLED`
  // above), and lib/monitoring.ts's own `addBreadcrumb` is always a safe
  // no-op if Sentry isn't configured.
  addBreadcrumb(name, properties ?? undefined);

  if (!analyticsEnabled) return;
  if (typeof window === "undefined") return;
  // `posthog.init()` (lib/posthog-provider.tsx) may not have run yet --
  // e.g. no NEXT_PUBLIC_POSTHOG_KEY configured, or this fires before the
  // root layout's effect does. `__loaded` is false in both cases, so
  // this silently no-ops rather than letting posthog-js log a warning.
  if (!posthog.__loaded) return;
  try {
    posthog.capture(name, properties);
  } catch {
    // Intentionally ignored -- see this file's module doc comment.
  }
}

export const analytics = {
  /**
   * Fires once, the moment a new game's round has actually been
   * prepared (word/hint resolved, roles assigned) -- see
   * components/round/RoundPreparationScreen.tsx. Never gates the game
   * itself: call this AFTER the round is stored/navigated to, never
   * before or via `await`.
   */
  gameStarted(data: {
    playerCount: number;
    mode: GameMode;
    category: Category;
    difficulty: Difficulty;
    roundSource?: RoundSource;
    offline?: boolean;
  }) {
    safeTrack("game_started", {
      playerCount: data.playerCount,
      mode: data.mode,
      category: data.category,
      difficulty: data.difficulty,
      ...(data.roundSource ? { roundSource: data.roundSource } : {}),
      ...(data.offline !== undefined ? { offline: data.offline } : {}),
    });
  },

  /**
   * Fires once per game, when the FINAL outcome (crew-win / imposter-win)
   * is reached -- see components/final-results/FinalResultsScreen.tsx,
   * gated on the same `recordedRef`/`session.id` guard as
   * `recordFinalResult` so a rerender or refresh can never double-fire
   * this.
   */
  gameCompleted(data: {
    playerCount: number;
    mode: GameMode;
    durationSeconds?: number;
    winner: FinalOutcome;
  }) {
    safeTrack("game_completed", {
      playerCount: data.playerCount,
      mode: data.mode,
      ...(data.durationSeconds !== undefined
        ? { durationSeconds: data.durationSeconds }
        : {}),
      winner: toWinner(data.winner),
    });
  },

  /**
   * Fires only from a reliable, explicit "leave" point in an already-
   * started game (the shared Leave Round/Game confirmation dialogs) --
   * never from a `beforeunload`/`visibilitychange`/tab-close heuristic,
   * which would produce false positives. See each screen's
   * `handleLeaveConfirmed`.
   */
  gameAbandoned(data: {
    phase: string;
    playerCount?: number;
    mode?: GameMode;
  }) {
    safeTrack("game_abandoned", {
      phase: data.phase,
      ...(data.playerCount !== undefined
        ? { playerCount: data.playerCount }
        : {}),
      ...(data.mode ? { mode: data.mode } : {}),
    });
  },

  /** Fires when the player picks a mode on the Setup screen (Screen 2's `GameModeSelector`). */
  modeSelected(mode: GameMode) {
    safeTrack("mode_selected", { mode });
  },

  /**
   * Fires exactly once per prepared round, from the single choke point
   * that resolves a round's content (game/game-engine.ts's
   * `getRoundContent`) -- reflects whichever tier actually won, never
   * `navigator.onLine` alone.
   */
  roundStarted(data: { source: RoundSource }) {
    safeTrack("round_started", { source: data.source });
  },

  /**
   * Fires when a round's actual lifecycle completes (not merely when a
   * reveal screen is opened). No current screen in this codebase marks
   * an individual round "completed" independently of the game-level
   * `game_completed`/`continueRound` cycle -- this helper exists so a
   * future explicit round-completion point can wire in without adding a
   * new analytics module.
   */
  roundCompleted(data?: { source?: RoundSource }) {
    safeTrack(
      "round_completed",
      data?.source ? { source: data.source } : undefined,
    );
  },

  /**
   * Fires when an eliminated imposter's final word guess is resolved.
   * NOTE: this codebase has no imposter final-guess mechanic today (see
   * game/final-results-flow.ts's doc comment) -- only vote-based
   * elimination exists, so nothing currently calls this. Kept here,
   * typed and ready, for when that feature is built.
   */
  imposterGuess(data: { correct: boolean }) {
    safeTrack("imposter_guess", { correct: data.correct });
  },

  /** Fires only after a fresh AI-generated round passes existing validation (tier 1 success). */
  aiRoundGenerated() {
    safeTrack("ai_round_generated");
  },

  /**
   * Fires once whenever tier 1 (AI) is not what ultimately serves a
   * round -- either the device was offline, or the AI request/validation
   * failed -- regardless of whether tier 2 (cache) or tier 3 (static
   * fallback) ends up serving it. Never includes the underlying error.
   */
  aiRoundFallback() {
    safeTrack("ai_round_fallback");
  },

  /** Fires once per real `appinstalled` browser event. */
  pwaInstalled() {
    safeTrack("pwa_installed");
  },
};
