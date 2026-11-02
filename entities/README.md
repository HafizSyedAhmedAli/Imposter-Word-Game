# entities

Domain models and their own data access — one folder per domain concept,
each exposing a single `index.ts` public API.

## Done

- `entities/settings` — `GameSettings` type, `getSettings`/`updateSettings`/
  `resetSettings`, backed by the `settings` Dexie table. Moved from
  `lib/settings-store.ts` as the pilot slice. Public API: `@/entities/settings`
  (barrel at `entities/settings/index.ts`) — internals live under
  `entities/settings/model/`.
  **Bridge dependencies (temporary, documented in the file itself):** still
  imports `getDb` from `@/lib/db` and `GameLanguage`/`DEFAULT_LANGUAGE`/
  `LANGUAGES` from `@/game/*`, since neither `lib/db.ts` nor `game/` has
  migrated yet. Update those two imports once `shared/api/db` and the
  relevant `game/` types move.
- `entities/player` — `Player` type (id, name only — no secret round
  state). Moved from `game/game-types.ts`. Public API: `@/entities/player`
  (barrel at `entities/player/index.ts`) — internals live under
  `entities/player/model/`. There is no dedicated player Dexie table to
  bring along: the player list is only ever persisted as part of
  `StoredGameSetup` (`lib/game-setup-store.ts`), which belongs to the
  planned `entities/game-session` slice below, not this one.
  **Bridge dependency (temporary, reversed from the settings pilot):**
  `game/game-types.ts` re-exports `Player` from `@/entities/player`
  instead of defining it, so the ~40 existing
  `import { Player } from "@/game/game-types"` call sites across
  `components/`, `game/`, `lib/`, and `providers/` keep working
  unchanged. Repoint each to `@/entities/player` as it's touched; the
  re-export in `game/game-types.ts` goes away once none are left.
- `entities/round` — `RoundContentSource`, `GeneratedRoundContent`,
  `PlayerRole`, `RoundData`, `RoundStatus`, `RoundSession`, plus
  `game/round-validation.ts`'s `validateRoundContent`,
  `containsNonLatinScript`, `looksLikeEnglishNotRomanUrdu`, and
  `validateRomanUrduHint`. Moved from `game/game-types.ts` and
  `game/round-validation.ts`. Public API: `@/entities/round` (barrel at
  `entities/round/index.ts`) — internals live under
  `entities/round/model/`.
  **Bridge dependencies (temporary, in both directions):**
  `RoundSession` still needs `GameLanguage` (not yet assigned a slice),
  imported from `@/game/game-types`, which in turn now re-exports this
  slice's types back out as its own temporary bridge, the same
  reversed pattern used for `entities/player`. `GameConfig` and
  `VotingHistoryEntry` no longer need bridges -- both are imported
  directly from their own entity slices now that those exist (ordinary,
  sparing cross-slice imports within the entities layer). `game/round-validation.ts` similarly
  re-exports this slice's validation functions so its ~7 existing
  consumers (`app/api/round/generate/route.ts`,
  `providers/ai-word-provider.ts`, `providers/custom-word-provider.ts`,
  `game/custom-word-rules.ts`, and their tests) keep working unchanged.
  These are type-only re-exports, so the remaining mutual dependency
  with `game/game-types.ts` doesn't create a runtime cycle -- but
  update the rest once `voting-history` exists and each consumer is
  repointed to `@/entities/round`.
- `entities/round` (addition, `recover-active-game` step) -- also owns
  persistence of the in-progress `RoundSession`: `getStoredRoundSession`
  / `storeRoundSession` / `clearStoredRoundSession` (sessionStorage) and
  the localStorage recovery mirror behind them (`getRecoverableActiveGame`,
  `markActiveGameRoute`, `clearActiveGameRecovery`, 24 h expiry). Moved
  from `lib/round-session-store.ts` and `lib/active-game-recovery.ts`;
  see `../features/README.md`'s `recover-active-game` entry for why this
  lives here and not in the feature.
- `entities/game-session` — `GameMode`, `Difficulty`, `TimerSettings`,
  `GameOptions`, `GameConfig`, `GameSession`. Moved from
  `game/game-types.ts`. Public API: `@/entities/game-session` (barrel
  at `entities/game-session/index.ts`) — internals live under
  `entities/game-session/model/`. There's no session-storage layer
  moved along with it: `lib/game-setup-store.ts` (which persists
  `GameConfig` + `Player[]` to `sessionStorage`) is tightly coupled to
  the Setup -> Players -> Round screen flow, so it wasn't pulled in
  here. `features/configure-game` has since been built and
  deliberately did not take it either (see its entry in
  `../features/README.md`): the eventual home is this slice, blocked
  on moving `DEFAULT_GAME_CONFIG`/`CUSTOM_CATEGORY`/`MAX_PLAYERS`/
  `validatePlayerName` out of `features/play-round` first. Also found in passing:
  `lib/game-setup-session-store.ts` is dead code (not imported
  anywhere, superseded by `lib/game-setup-store.ts`) -- left untouched
  since removing it wasn't part of this change.
  **Bridge dependency (temporary):** `GameConfig` still imports
  `Category` from `@/game/game-types`, since `Category` hasn't been
  assigned a slice yet (see the `entities/word` entry below for why it
  didn't move there). `game/game-types.ts` re-exports this slice's types
  back out as a temporary bridge, same reversed pattern as
  `entities/player`/`entities/round`, so its ~22 existing consumers of
  `GameConfig`/`GameMode`/`GameOptions`/`TimerSettings` keep working
  unchanged.
- `entities/word` — the `WordProvider` interface, its three tiered
  implementations (`AiWordProvider`, `IndexedDbCacheProvider`,
  `FallbackWordProvider`), and the static tier-3 word list
  (`FALLBACK_WORDS`, `FallbackWordEntry`, `getRandomFallbackWord`).
  Moved from `providers/{word,ai-word,indexeddb-cache,fallback-word}-provider.ts`
  and `lib/fallback-words/` (the twelve category folders moved
  unchanged -- their relative `../types` imports still resolve).
  Public API: `@/entities/word` (barrel at `entities/word/index.ts`) —
  internals live under `entities/word/model/`.
  **Not moved, on purpose:**
  - `providers/custom-word-provider.ts` — it depends on the custom-word
    row type and `updateCustomWordHint`, so it moved with
    `entities/custom-word` (below), not this slice.
  - `lib/recent-words.ts` — the session-storage "already shown" tracker
    is also imported by `lib/db.ts` and `features/reset-game-data/model/reset-game-data.ts`, so it
    stays put as a bridge (`entities/word` imports it from
    `@/lib/recent-words`) until `lib/db.ts` moves.
  - `Category` — it was flagged above as a candidate for this slice, but
    moving it now would make `entities/game-session` and `entities/word`
    depend on each other: `WordProvider` needs `Difficulty` from
    `game-session`, and `GameConfig` needs `Category` from here. It stays
    in `game/game-types.ts` for now; resolve by moving `Category` and
    `Difficulty` together (and `GeneratedRoundContent`, which
    `entities/round` would then also import from here) in one change.
  **Bridge dependencies (temporary):** imports `Category`, `GameLanguage`,
  `ENGLISH`, `ROMAN_URDU` from `@/game/game-types`, `getRandomCachedWord`
  from `@/lib/db`, and `getShownWordIds`/`rememberWordId` from
  `@/lib/recent-words`. Imports `Difficulty` from `@/entities/game-session`
  and `GeneratedRoundContent` + the validation functions from
  `@/entities/round` directly (ordinary, sparing cross-slice imports).
  Nothing in `entities/game-session` or `entities/round` imports back
  from this slice, so the graph stays acyclic.
  The old paths are thin re-export bridges, same reversed pattern as the
  other slices: `providers/ai-word-provider.ts`,
  `providers/indexeddb-cache-provider.ts`,
  `providers/fallback-word-provider.ts`, and `lib/fallback-words.ts`
  (previously a directory). Their existing consumers
  (`game/game-engine.ts` and four test files) keep working unchanged;
  repoint each to `@/entities/word` as it's touched.
- `entities/custom-word` — the `CustomWordEntry` / `AddCustomWordResult`
  types, the pure validation rules (`MAX_CUSTOM_WORD_LENGTH`,
  `validateCustomWordText`), the data access
  (`addCustomWord`, `getCustomWords`, `deleteCustomWord`,
  `updateCustomWordHint`, `getRandomCustomWord`, `clearCustomWords`),
  and the hint resolver (`resolveCustomWordHint`). Moved from
  `game/custom-word-rules.ts`, `providers/custom-word-provider.ts`, and
  the Custom Words section of `lib/db.ts`. Public API:
  `@/entities/custom-word` (barrel at `entities/custom-word/index.ts`) —
  internals live under `entities/custom-word/model/`.
  **Not moved, on purpose:** the `customWords` Dexie table declaration
  (schema versions v6–v8 and their migrations) stays in `lib/db.ts`
  alongside every other table -- it moves when `lib/db.ts` itself does
  (planned `shared/api/db`). `getDb` is imported from there.
  **Bridge dependencies (temporary):** imports `getDb` from `@/lib/db`,
  `captureError` from `@/lib/monitoring`, `getRecentWordIds`/
  `rememberWordId` from `@/lib/recent-words`, and `Category`,
  `GameLanguage`, `ENGLISH`, `ROMAN_URDU` from `@/game/game-types`.
  Imports `Difficulty` from `@/entities/game-session` and
  `validateRomanUrduHint` from `@/entities/round` directly.
  **Bridge in the other direction (note the runtime cycle):**
  `lib/db.ts` imports the `CustomWordEntry` type from this slice for its
  `Table<CustomWordEntry>` declaration (type-only, erased) and
  re-exports the six functions and both types from this slice so its
  ~12 existing consumers (four Settings/Setup components,
  `game/game-engine.ts`, `features/reset-game-data/model/reset-game-data.ts`, and four test files)
  keep working unchanged. Unlike the type-only bridges above, the
  function re-exports are a real runtime cycle (`lib/db.ts` <->
  `entities/custom-word`). It's benign -- every function only touches
  `getDb` when *called*, never at module load, and the suite passes
  whether the entry point is `lib/db.ts`, the slice barrel, or
  `game/game-engine.ts` -- but it disappears once consumers are
  repointed to `@/entities/custom-word` and `lib/db.ts` drops those
  re-exports. Two more thin bridges: `game/custom-word-rules.ts` and
  `providers/custom-word-provider.ts` re-export from the slice
  (`AddCustomWordCard.tsx`, `game/game-engine.ts`, and two test files
  use them).
- `entities/achievement` — the achievement definitions
  (`ACHIEVEMENTS`, `ACHIEVEMENT_CATEGORY_LABELS`, `getAchievementById`),
  the pure evaluation engine (`buildAchievementPlayerContexts`,
  `evaluateAchievementsForPlayer`), the orchestration layer
  (`processAchievementsForCompletedGame`, `getAchievementsSnapshot`,
  `resetAchievements`), the `AchievementUnlockRecord` type, and the
  unlock data access (`recordAchievementUnlock`, `getAchievementUnlocks`,
  `getAchievementUnlocksForPlayer`, `clearAchievementUnlocks`). Moved from
  `lib/achievements/{definitions,engine,store}.ts` and the Achievements
  section of `lib/db.ts`. Public API: `@/entities/achievement` (barrel at
  `entities/achievement/index.ts`) — internals live under
  `entities/achievement/model/`.
  **Not moved, on purpose:** the `achievementUnlocks` Dexie table
  declaration (v8) stays in `lib/db.ts`, same reasoning as
  `customWords` above.
  **Bridge dependencies:** `CompletedGameRecord` still comes from `@/lib/db`
  (that type's own bridge, documented under `entities/statistics` below --
  same acceptable pattern `entities/word` uses for `@/lib/db`'s
  `getRandomCachedWord`). `computePlayerStatistics`/`PlayerStatistics` and
  `getGameHistory` are no longer a bridge -- both slices exist now, so
  the store/engine import them directly from `@/entities/statistics`
  (achievement -> statistics, never the reverse: nothing in those
  modules imports achievements, so the graph stays acyclic). Also imports
  `getDb` from `@/lib/db` and `captureError` from `@/lib/monitoring`.
  `RoundSession` comes directly from `@/entities/round`. `definitions`
  and `engine` still import each other's *types* (as they did before the
  move), which is erased at compile time.
  **Bridge in the other direction (same runtime cycle as
  `entities/custom-word`):** `lib/db.ts` imports the
  `AchievementUnlockRecord` type from this slice for its
  `Table<AchievementUnlockRecord>` declaration and re-exports the four
  unlock functions and the type, so the direct `@/lib/db` importers
  (`AchievementCategorySection.tsx` and two test files) keep working.
  Benign for the same reason -- `getDb` is only touched when a function
  is *called*. Three more thin bridges at the old paths,
  `lib/achievements/definitions.ts`, `engine.ts`, and `store.ts`,
  re-export from the slice (six components under
  `components/achievements/` and `components/final-results/`,
  `features/reset-game-data/model/reset-game-data.ts`, and four test files use them).
- `entities/statistics` — `CompletedGamePlayerResult`, `CompletedGameRecord`
  (moved from `lib/db.ts`, alongside their `recordCompletedGame`/
  `getCompletedGames`/`clearCompletedGames` CRUD, into
  `model/completed-game-store.ts`), plus `statistics-aggregation.ts`,
  `statistics-record.ts`, and `game-statistics-store.ts`. Public API:
  `@/entities/statistics` (barrel at `entities/statistics/index.ts`) —
  internals live under `entities/statistics/model/`.
  **Not moved, on purpose:** the `completedGames` Dexie table
  declaration itself stays in `lib/db.ts`, same reasoning as
  `entities/custom-word`'s `customWords` table. `getDb` is imported
  from there.
  **Bridge dependencies (temporary):** `completed-game-store.ts` imports
  `Category`/`Difficulty`/`GameMode` from `@/game/game-types` (not yet
  assigned a slice) and `getDb`/`captureError` from `@/lib/db` /
  `@/lib/monitoring`. `statistics-record.ts` and `game-statistics-store.ts`
  still import `FinalOutcome` (and, in `statistics-record.ts`,
  `getFinalPlayerResults`/`getFinalVotingHistory`/`getRoundSummary`) from
  `@/game/final-results-flow` -- `features/play-round` territory, not
  something this slice can resolve. `RoundSession` doesn't need a bridge:
  both files import it directly from `@/entities/round`.
  **Bridge in the other direction:** `lib/db.ts` imports
  `CompletedGameRecord` from this slice for its own
  `Table<CompletedGameRecord>` declaration (type-only, erased) and
  re-exports the type plus the three CRUD functions, same reversed
  pattern as `entities/custom-word`, so its remaining consumers keep
  working unchanged. This is what let `entities/achievement` (above)
  drop its own bridge to `@/lib/statistics-aggregation`/
  `@/lib/game-statistics-store` and import this slice directly.
- `entities/voting-history` — `VotingHistoryEntry`, `VotingHistoryTallyEntry`,
  `VotingHistoryVerdict`. Pure types, no functions or data access --
  the logic that builds/appends an entry onto a `RoundSession`
  (`getVotingHistory`/`recordVotingHistoryEntry`) lives in
  `features/play-round/model/results-flow.ts`, not this slice. Public
  API: `@/entities/voting-history` (barrel at
  `entities/voting-history/index.ts`).
  **Bridge in the other direction:** `game/game-types.ts` re-exports
  the three types from this slice, same reversed pattern used for
  `entities/player`/`entities/round`/`entities/game-session`, so its
  remaining consumers keep working unchanged.

This closes out every `entities/*` slice identified in the original
migration plan. Next layer up: `features/*` (see `../features/README.md`).

Import from other layers: `shared/` only.