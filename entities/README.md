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
  `RoundSession` needs `GameLanguage` (not yet assigned a slice) and
  `VotingHistoryEntry` (planned `entities/voting-history`), both still
  imported from `@/game/game-types`, which in turn now re-exports this
  slice's types back out as its own temporary bridge, the same
  reversed pattern used for `entities/player`. `GameConfig` no longer
  needs a bridge -- once `entities/game-session` moved (below), this
  slice was repointed to import it directly from
  `@/entities/game-session` (an ordinary, sparing cross-slice import
  within the entities layer). `game/round-validation.ts` similarly
  re-exports this slice's validation functions so its ~7 existing
  consumers (`app/api/round/generate/route.ts`,
  `providers/ai-word-provider.ts`, `providers/custom-word-provider.ts`,
  `game/custom-word-rules.ts`, and their tests) keep working unchanged.
  These are type-only re-exports, so the remaining mutual dependency
  with `game/game-types.ts` doesn't create a runtime cycle -- but
  update the rest once `voting-history` exists and each consumer is
  repointed to `@/entities/round`.
- `entities/game-session` — `GameMode`, `Difficulty`, `TimerSettings`,
  `GameOptions`, `GameConfig`, `GameSession`. Moved from
  `game/game-types.ts`. Public API: `@/entities/game-session` (barrel
  at `entities/game-session/index.ts`) — internals live under
  `entities/game-session/model/`. There's no session-storage layer
  moved along with it: `lib/game-setup-store.ts` (which persists
  `GameConfig` + `Player[]` to `sessionStorage`) is tightly coupled to
  the Setup -> Players -> Round screen flow, so it's left for the
  planned `features/configure-game` slice (see `../ARCHITECTURE.md`'s
  step 6) rather than pulled in here. Also found in passing:
  `lib/game-setup-session-store.ts` is dead code (not imported
  anywhere, superseded by `lib/game-setup-store.ts`) -- left untouched
  since removing it wasn't part of this change.
  **Bridge dependency (temporary):** `GameConfig` still imports
  `Category` from `@/game/game-types`, since `Category` hasn't been
  assigned a slice yet (candidate for the planned `entities/word`
  slice below). `game/game-types.ts` re-exports this slice's types
  back out as a temporary bridge, same reversed pattern as
  `entities/player`/`entities/round`, so its ~22 existing consumers of
  `GameConfig`/`GameMode`/`GameOptions`/`TimerSettings` keep working
  unchanged.

## Planned slices (not yet moved — see `../ARCHITECTURE.md`)

- `entities/word` — `providers/word-provider.ts` and its
  ai/fallback/cache/custom implementations, `lib/fallback-words/`
- `entities/custom-word` — `game/custom-word-rules.ts` + `customWords` table
- `entities/achievement` — `lib/achievements/*`
- `entities/statistics` — `lib/statistics-aggregation.ts`, `statistics-record.ts`
- `entities/voting-history` — `VotingHistoryEntry`, `VotingHistoryTallyEntry`,
  `VotingHistoryVerdict`

Import from other layers: `shared/` only.