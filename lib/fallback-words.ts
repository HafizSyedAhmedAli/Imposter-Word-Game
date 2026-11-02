// lib/fallback-words.ts
//
// Temporary bridge -- the static fallback word list and
// `getRandomFallbackWord` now live in `entities/word` (see
// entities/README.md). Existing `import { FALLBACK_WORDS,
// getRandomFallbackWord } from "@/lib/fallback-words"` call sites (tests,
// including a dynamic import in test/lib/reset-game-data.test.ts) keep
// working unchanged. Repoint each to `@/entities/word` as it's touched;
// this file goes away once none are left.
export { FALLBACK_WORDS, getRandomFallbackWord } from "@/entities/word";
export type { FallbackWordEntry } from "@/entities/word";