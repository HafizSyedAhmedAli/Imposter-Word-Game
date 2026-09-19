// entities/achievement/model/achievement-engine.ts
import type { CompletedGameRecord } from "@/lib/db";
import {
  computePlayerStatistics,
  type PlayerStatistics,
} from "@/lib/statistics-aggregation";
import {
  ACHIEVEMENTS,
  type AchievementDefinition,
  type AchievementEvaluation,
} from "./achievement-definitions";

/**
 * NOTE on the imports above: `CompletedGameRecord` (lib/db.ts) and
 * `computePlayerStatistics`/`PlayerStatistics`
 * (lib/statistics-aggregation.ts) belong to the planned
 * `entities/statistics` slice and are still the pre-FSD locations --
 * see ../../README.md. Deliberate, temporary bridges; this slice depends
 * on statistics (never the other way around), so the graph stays
 * acyclic once that slice exists.
 */

/**
 * The pure "Achievement Evaluation" step of the pipeline:
 *
 *   Completed Game -> Statistics -> Achievement Evaluation ->
 *   Unlocked Achievements -> Achievements UI
 *
 * Nothing here talks to Dexie, and nothing here re-derives a game's
 * winner/roles/catch count itself -- every number an achievement
 * condition checks is either reused directly from
 * lib/statistics-aggregation.ts's `computePlayerStatistics` (games
 * played, crew/imposter wins -- see spec section 13, "reuse existing
 * functions/data") or derived in one extra pass over the same
 * `CompletedGameRecord[]` for the handful of fields per-player lifetime
 * statistics doesn't already carry (full-house games, multi-imposter
 * wins, crew catch-assists -- see ./achievement-definitions.ts's doc
 * comment for exactly what's available and why).
 *
 * Deterministic: the same `games` array always produces the same
 * contexts and the same evaluation results, with no reliance on
 * wall-clock time or call order (spec section 19).
 */

export type AchievementPlayerContext = {
  normalizedName: string;
  displayName: string;
  stats: PlayerStatistics;
  /** Completed games (any category, including Custom Words -- see
   * spec section 14) this player took part in with `playerCount >= 12`. */
  full12PlayerGames: number;
  /** Completed games this player won as an Imposter with exactly 2
   * Imposters that game. */
  doubleTroubleWins: number;
  /** Same as `doubleTroubleWins`, for exactly 3 Imposters. */
  tripleThreatWins: number;
  /** Completed games this player played as Crew where at least one
   * Imposter was caught that game (`impostersCaught >= 1`) -- see
   * ./achievement-definitions.ts's doc comment on "Imposter Hunter"/
   * "Sharp Eyes" for why this is the honest available proxy for
   * "helped catch an Imposter", rather than per-vote attribution the
   * stored data doesn't have. */
  crewCatchAssists: number;
};

type ExtraAccumulator = {
  displayName: string;
  full12PlayerGames: number;
  doubleTroubleWins: number;
  tripleThreatWins: number;
  crewCatchAssists: number;
};

/**
 * Builds every local player's achievement-evaluation context from the
 * full completed-game history in one pass. `games` order doesn't matter
 * here (unlike `computePlayerStatistics`, which uses it only to pick a
 * "most current" display name) -- every field this function adds is a
 * pure count, order-independent.
 */
export function buildAchievementPlayerContexts(
  games: CompletedGameRecord[],
): Map<string, AchievementPlayerContext> {
  const statsList = computePlayerStatistics(games);
  const statsByName = new Map(statsList.map((s) => [s.normalizedName, s]));

  const extraByName = new Map<string, ExtraAccumulator>();

  for (const game of games) {
    for (const player of game.players) {
      const acc: ExtraAccumulator = extraByName.get(player.normalizedName) ?? {
        displayName: player.name,
        full12PlayerGames: 0,
        doubleTroubleWins: 0,
        tripleThreatWins: 0,
        crewCatchAssists: 0,
      };

      acc.displayName = player.name;

      if (game.playerCount >= 12) {
        acc.full12PlayerGames += 1;
      }

      if (player.role === "imposter" && game.winner === "imposter-win") {
        if (game.imposterCount === 2) acc.doubleTroubleWins += 1;
        if (game.imposterCount === 3) acc.tripleThreatWins += 1;
      }

      if (player.role === "player" && game.impostersCaught >= 1) {
        acc.crewCatchAssists += 1;
      }

      extraByName.set(player.normalizedName, acc);
    }
  }

  const contexts = new Map<string, AchievementPlayerContext>();
  for (const [normalizedName, stats] of statsByName) {
    const extra = extraByName.get(normalizedName);
    contexts.set(normalizedName, {
      normalizedName,
      displayName: stats.displayName,
      stats,
      full12PlayerGames: extra?.full12PlayerGames ?? 0,
      doubleTroubleWins: extra?.doubleTroubleWins ?? 0,
      tripleThreatWins: extra?.tripleThreatWins ?? 0,
      crewCatchAssists: extra?.crewCatchAssists ?? 0,
    });
  }
  return contexts;
}

export type AchievementState = {
  definition: AchievementDefinition;
} & AchievementEvaluation;

/** Evaluates every achievement definition against one player's context.
 * Order follows `ACHIEVEMENTS` (definition order), so the UI never has
 * to re-sort. */
export function evaluateAchievementsForPlayer(
  ctx: AchievementPlayerContext,
): AchievementState[] {
  return ACHIEVEMENTS.map((definition) => ({
    definition,
    ...definition.evaluate(ctx),
  }));
}