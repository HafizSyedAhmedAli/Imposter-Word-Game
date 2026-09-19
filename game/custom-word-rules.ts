// game/custom-word-rules.ts
//
// Temporary bridge -- the Custom Words validation rules now live in
// `entities/custom-word` (see entities/README.md). Existing `import { ...
// } from "@/game/custom-word-rules"` call sites
// (components/settings/custom-words/AddCustomWordCard.tsx, tests) keep
// working unchanged. Repoint each to `@/entities/custom-word` as it's
// touched; this file goes away once none are left.
export {
  MAX_CUSTOM_WORD_LENGTH,
  validateCustomWordText,
} from "@/entities/custom-word";
export type {
  CustomWordValidation,
  ExistingCustomWord,
} from "@/entities/custom-word";