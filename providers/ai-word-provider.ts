// providers/ai-word-provider.ts
//
// Temporary bridge -- `AiWordProvider` now lives in `entities/word` (see
// entities/README.md). Existing `import { AiWordProvider } from
// "@/providers/ai-word-provider"` call sites (game/game-engine.ts, tests)
// keep working unchanged. Repoint each to `@/entities/word` as it's
// touched; this file goes away once none are left.
export { AiWordProvider } from "@/entities/word";