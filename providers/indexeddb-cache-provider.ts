// providers/indexeddb-cache-provider.ts
//
// Temporary bridge -- `IndexedDbCacheProvider` now lives in
// `entities/word` (see entities/README.md). Existing `import {
// IndexedDbCacheProvider } from "@/providers/indexeddb-cache-provider"`
// call sites (game/game-engine.ts, tests) keep working unchanged.
// Repoint each to `@/entities/word` as it's touched; this file goes
// away once none are left.
export { IndexedDbCacheProvider } from "@/entities/word";