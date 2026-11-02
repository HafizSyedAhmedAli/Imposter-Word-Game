// features/configure-game/model/config-updates.ts
import type { Category } from "@/game/game-types";
import type {
  Difficulty,
  GameConfig,
  GameMode,
  TimerSettings,
} from "@/entities/game-session";
import { CUSTOM_CATEGORY } from "@/features/play-round";

/**
 * Pure `GameConfig -> GameConfig` transitions for the Setup screen.
 *
 * These used to be inline `setConfig((prev) => ...)` callbacks inside
 * `GameSetupProvider` (lib/game-setup-context.tsx). They live here now
 * so the config rules -- most importantly the `customWordCategory`
 * invariant below -- belong to this slice and can be unit-tested
 * without mounting React. The provider is still the (temporary) state
 * container that calls them; see `features/README.md`.
 *
 * Every function returns a new object and never mutates `config`.
 */

export function withMode(config: GameConfig, mode: GameMode): GameConfig {
  return { ...config, mode };
}

/**
 * Any selection made through the normal category row / "More" sheet
 * means the player has left Custom Words mode -- always clear a stale
 * `customWordCategory` here so it can never linger onto a later
 * `CUSTOM_CATEGORY` selection it wasn't actually chosen for.
 */
export function withCategory(
  config: GameConfig,
  category: Category,
): GameConfig {
  return { ...config, category, customWordCategory: undefined };
}

/**
 * Sets the category to `CUSTOM_CATEGORY` and records which of the
 * player's saved custom-word categories to draw from, in one atomic
 * update -- see `GameConfig.customWordCategory`'s doc comment. Used only
 * by the Custom Words toggle in `CategorySelector`; every other
 * category selection goes through `withCategory` instead.
 */
export function withCustomWordCategory(
  config: GameConfig,
  category: Category,
): GameConfig {
  return {
    ...config,
    category: CUSTOM_CATEGORY,
    customWordCategory: category,
  };
}

export function withDifficulty(
  config: GameConfig,
  difficulty: Difficulty,
): GameConfig {
  return { ...config, difficulty };
}

export function withDiscussionTimer(
  config: GameConfig,
  patch: Partial<TimerSettings>,
): GameConfig {
  return {
    ...config,
    options: {
      ...config.options,
      discussionTimer: { ...config.options.discussionTimer, ...patch },
    },
  };
}

export function withVotingTimer(
  config: GameConfig,
  patch: Partial<TimerSettings>,
): GameConfig {
  return {
    ...config,
    options: {
      ...config.options,
      votingTimer: { ...config.options.votingTimer, ...patch },
    },
  };
}