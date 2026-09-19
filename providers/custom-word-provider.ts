// providers/custom-word-provider.ts
//
// Temporary bridge -- `resolveCustomWordHint` now lives in
// `entities/custom-word` (see entities/README.md). Existing `import {
// resolveCustomWordHint } from "@/providers/custom-word-provider"` call
// sites (game/game-engine.ts, tests) keep working unchanged. Repoint each
// to `@/entities/custom-word` as it's touched; this file goes away once
// none are left.
export { resolveCustomWordHint } from "@/entities/custom-word";