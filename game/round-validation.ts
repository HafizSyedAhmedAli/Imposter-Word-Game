// game/round-validation.ts
//
// NOTE: this module's contents now live in `entities/round` (see
// entities/README.md) -- this file re-exports them as a temporary
// bridge so existing `import ... from "@/game/round-validation"` call
// sites (app/api/round/generate/route.ts, providers/ai-word-provider.ts,
// providers/custom-word-provider.ts, game/custom-word-rules.ts, and
// their tests) keep working unchanged. Repoint each to
// `@/entities/round` as it's touched; this file goes away once none
// are left.
export {
  validateRoundContent,
  containsNonLatinScript,
  looksLikeEnglishNotRomanUrdu,
  validateRomanUrduHint,
} from "@/entities/round";
export type {
  RoundContentCandidate,
  RoundContentValidation,
} from "@/entities/round";
