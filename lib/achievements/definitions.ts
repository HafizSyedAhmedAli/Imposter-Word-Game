// lib/achievements/definitions.ts
import {
  Crown,
  Eye,
  Flame,
  type LucideIcon,
  Layers,
  PartyPopper,
  Rocket,
  ShieldCheck,
  Search,
  Skull,
  Users,
  VenetianMask,
} from "lucide-react";
import type { AchievementPlayerContext } from "./engine";

/**
 * Centralized Achievement definitions -- the single place every
 * achievement's id/copy/icon/category/unlock-condition lives. The UI
 * (components/achievements/*) never hard-codes a single achievement
 * rule of its own; it only ever maps over `ACHIEVEMENTS` below. Adding
 * a new achievement later means adding one entry here -- no UI change
 * required (spec's "adding a new achievement later should require
 * changing one definition/rule rather than rewriting the achievement
 * UI").
 *
 * IMPORTANT -- what this set deliberately does NOT include:
 *
 * The original brief additionally asked for a "Mind Reader" achievement
 * ("successfully guess the secret word after being caught"). This
 * codebase has no "final guess" mechanic -- only vote-based elimination
 * exists (see game/final-results-flow.ts's own doc comment: "this
 * codebase's `RoundSession` has no 'final guess' field"). There is
 * therefore no real signal anywhere to evaluate that condition against,
 * and inventing one (e.g. treating "caught" as a guess) would be
 * fabricating player behavior that never happened -- exactly what the
 * brief itself says never to do. It's intentionally left out of this
 * initial set; if a final-guess mechanic is ever added to the game
 * engine, an achievement for it slots in here as one more entry.
 *
 * "Imposter Hunter" / "Sharp Eyes" are also adapted from how the brief
 * described them. The brief's wording ("caused/participated in an
 * Imposter elimination", "attributed to the player") implies per-player
 * voting attribution -- but `CompletedGamePlayerResult` only stores
 * `votesReceived` (aggregate votes a player received), never who voted
 * for whom (see lib/db.ts's doc comment: "never who-voted-for-whom").
 * There is no way to know which specific crew members' votes actually
 * caught a given imposter. The closest honest signal actually available
 * is game-level: `CompletedGameRecord.impostersCaught` (how many
 * imposters were caught that game) combined with a player's own `role`
 * that game. So these two achievements are defined here as "played on
 * the crew team in a completed game where at least one imposter was
 * caught" -- crediting every surviving crew member who was part of a
 * winning catch, not a specific vote-caster. This is a real, stored
 * fact (not invented), just a coarser one than "your vote caught them".
 */

export type AchievementCategory =
  | "getting-started"
  | "crew"
  | "imposter"
  | "special";

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> =
  {
    "getting-started": "Getting Started",
    crew: "Crew",
    imposter: "Imposter",
    special: "Special",
  };

/** Every achievement always reports a `current`/`target` pair (clamped
 * to `target`), even for achievements with no meaningful partial state
 * (e.g. "win a 3-imposter game") -- `AchievementDefinition.binary`
 * below is what tells the UI to render a plain LOCKED/UNLOCKED pill
 * instead of a progress bar for those, rather than the evaluation logic
 * ever fabricating a fake in-between value (spec's "do not make fake
 * progress values"). */
export type AchievementProgress = {
  current: number;
  target: number;
};

export type AchievementEvaluation = {
  unlocked: boolean;
  progress: AchievementProgress;
};

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: AchievementCategory;
  /** True for achievements with no meaningful partial-progress state
   * (e.g. "win a 12-player game") -- the UI shows LOCKED/UNLOCKED
   * instead of an N/1 progress bar for these. */
  binary: boolean;
  /** Pure, deterministic evaluation against one local player's
   * already-aggregated context (see lib/achievements/engine.ts). Never
   * touches Dexie/IndexedDB itself. */
  evaluate: (ctx: AchievementPlayerContext) => AchievementEvaluation;
};

function countProgress(current: number, target: number): AchievementProgress {
  return { current: Math.min(current, target), target };
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  /* ---------------------------- Getting Started ---------------------------- */
  {
    id: "first_game",
    title: "First Game",
    description: "Complete your first game.",
    icon: Rocket,
    category: "getting-started",
    binary: true,
    evaluate: (ctx) => ({
      unlocked: ctx.stats.gamesPlayed >= 1,
      progress: countProgress(ctx.stats.gamesPlayed, 1),
    }),
  },
  {
    id: "party_starter",
    title: "Party Starter",
    description: "Play 10 completed games.",
    icon: PartyPopper,
    category: "getting-started",
    binary: false,
    evaluate: (ctx) => ({
      unlocked: ctx.stats.gamesPlayed >= 10,
      progress: countProgress(ctx.stats.gamesPlayed, 10),
    }),
  },
  {
    id: "party_legend",
    title: "Party Legend",
    description: "Play 50 completed games.",
    icon: Crown,
    category: "getting-started",
    binary: false,
    evaluate: (ctx) => ({
      unlocked: ctx.stats.gamesPlayed >= 50,
      progress: countProgress(ctx.stats.gamesPlayed, 50),
    }),
  },

  /* -------------------------------- Crew ------------------------------- */
  {
    id: "imposter_hunter",
    title: "Imposter Hunter",
    description: "Play a crew game where the Imposter was caught.",
    icon: Search,
    category: "crew",
    binary: true,
    evaluate: (ctx) => ({
      unlocked: ctx.crewCatchAssists >= 1,
      progress: countProgress(ctx.crewCatchAssists, 1),
    }),
  },
  {
    id: "sharp_eyes",
    title: "Sharp Eyes",
    description: "Help catch 10 Imposters as Crew.",
    icon: Eye,
    category: "crew",
    binary: false,
    evaluate: (ctx) => ({
      unlocked: ctx.crewCatchAssists >= 10,
      progress: countProgress(ctx.crewCatchAssists, 10),
    }),
  },
  {
    id: "crew_veteran",
    title: "Crew Veteran",
    description: "Win 10 games as Crew.",
    icon: ShieldCheck,
    category: "crew",
    binary: false,
    evaluate: (ctx) => ({
      unlocked: ctx.stats.crewWins >= 10,
      progress: countProgress(ctx.stats.crewWins, 10),
    }),
  },

  /* ------------------------------ Imposter ------------------------------ */
  {
    id: "first_betrayal",
    title: "First Betrayal",
    description: "Win your first game as an Imposter.",
    icon: VenetianMask,
    category: "imposter",
    binary: true,
    evaluate: (ctx) => ({
      unlocked: ctx.stats.imposterWins >= 1,
      progress: countProgress(ctx.stats.imposterWins, 1),
    }),
  },
  {
    id: "master_of_deception",
    title: "Master of Deception",
    description: "Win 10 games as an Imposter.",
    icon: Skull,
    category: "imposter",
    binary: false,
    evaluate: (ctx) => ({
      unlocked: ctx.stats.imposterWins >= 10,
      progress: countProgress(ctx.stats.imposterWins, 10),
    }),
  },

  /* ------------------------------- Special ------------------------------- */
  {
    id: "full_house",
    title: "Full House",
    description: "Complete a game with 12 players.",
    icon: Users,
    category: "special",
    binary: true,
    evaluate: (ctx) => ({
      unlocked: ctx.full12PlayerGames >= 1,
      progress: countProgress(ctx.full12PlayerGames, 1),
    }),
  },
  {
    id: "double_trouble",
    title: "Double Trouble",
    description: "Win a game with 2 Imposters.",
    icon: Layers,
    category: "special",
    binary: true,
    evaluate: (ctx) => ({
      unlocked: ctx.doubleTroubleWins >= 1,
      progress: countProgress(ctx.doubleTroubleWins, 1),
    }),
  },
  {
    id: "triple_threat",
    title: "Triple Threat",
    description: "Win a game with 3 Imposters.",
    icon: Flame,
    category: "special",
    binary: true,
    evaluate: (ctx) => ({
      unlocked: ctx.tripleThreatWins >= 1,
      progress: countProgress(ctx.tripleThreatWins, 1),
    }),
  },
];

export function getAchievementById(
  id: string,
): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}