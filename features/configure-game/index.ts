// features/configure-game — public API. Import from
// "@/features/configure-game", never reach into
// "@/features/configure-game/ui/*" or "/model/*" from outside this slice.
//
// Deliberately NOT exported (internal to this slice): CategoryCard,
// DifficultyCard, GameModeCard, MoreCategoriesSheet, TimerOption, and
// the two mascots -- each is only ever rendered by one of the selectors
// below.
export { default as GameModeSelector } from "./ui/GameModeSelector";
export { default as CategorySelector } from "./ui/CategorySelector";
export { default as DifficultySelector } from "./ui/DifficultySelector";
export { default as GameOptions } from "./ui/GameOptions";
export { default as GameConfigSummary } from "./ui/GameConfigSummary";

export {
  withMode,
  withCategory,
  withCustomWordCategory,
  withDifficulty,
  withDiscussionTimer,
  withVotingTimer,
} from "./model/config-updates";
