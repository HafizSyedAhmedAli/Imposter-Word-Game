// entities/round — public API. Import from "@/entities/round", never
// reach into "@/entities/round/model/*" from outside this slice.
export type {
  RoundContentSource,
  GeneratedRoundContent,
  PlayerRole,
  RoundData,
  RoundStatus,
  RoundSession,
} from "./model/round-types";

export {
  validateRoundContent,
  containsNonLatinScript,
  looksLikeEnglishNotRomanUrdu,
  validateRomanUrduHint,
} from "./model/round-validation";
export type {
  RoundContentCandidate,
  RoundContentValidation,
} from "./model/round-validation";

// Persistence of the in-progress round (sessionStorage, tab-scoped) and
// its localStorage mirror used to offer "Game in Progress" recovery after
// a full app close. Moved here from `lib/round-session-store.ts` and
// `lib/active-game-recovery.ts`: this is data access for `RoundSession`,
// and `storeRoundSession()` is the one choke point that keeps the mirror
// in sync, so both belong in the same slice. `mirrorActiveGameSession`
// is deliberately NOT exported -- only `storeRoundSession` calls it.
export {
  getStoredRoundSession,
  storeRoundSession,
  clearStoredRoundSession,
} from "./model/round-session-store";
export {
  getRecoverableActiveGame,
  markActiveGameRoute,
  clearActiveGameRecovery,
} from "./model/active-game-recovery";
export type { ActiveGameRoute } from "./model/active-game-recovery";
