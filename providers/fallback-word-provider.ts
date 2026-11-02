// providers/fallback-word-provider.ts
//
// Temporary bridge -- `FallbackWordProvider` now lives in
// `entities/word` (see entities/README.md). Existing `import {
// FallbackWordProvider } from "@/providers/fallback-word-provider"`
// call sites (game/game-engine.ts, tests) keep working unchanged.
// Repoint each to `@/entities/word` as it's touched; this file goes
// away once none are left.
export { FallbackWordProvider } from "@/entities/word";