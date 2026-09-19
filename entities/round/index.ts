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