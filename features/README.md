# features

One independent, user-facing capability per slice, each exposing a single
`index.ts` public API. If a piece of UI/logic only makes sense composed
inside one specific screen (not reusable as a standalone capability), it's a
`widgets/` concern instead, not a feature.

## Done

- `features/play-round` — the cross-entity round orchestration
  (`game-engine.ts`, `game-rules.ts`, `role-assignment.ts`,
  `elimination.ts`, `discussion-flow.ts`, `pass-flow.ts`, `vote-flow.ts`,
  `results-flow.ts`, `final-results-flow.ts`) moved from `game/` unchanged
  apart from import fixes. Public API: `@/features/play-round` (barrel at
  `features/play-round/index.ts`, `export *` from all nine model files —
  their export names are disjoint, checked at move time, so this is safe
  including `results-flow.ts` re-exporting `elimination.ts`'s
  `getEliminatedPlayerIds`/`isEliminated` as the same binding).
  Every file's `Player`/`RoundSession`/`PlayerRole`/`GameConfig`/etc.
  import now goes directly to its owning entity
  (`@/entities/player`, `@/entities/round`, `@/entities/game-session`)
  instead of the `@/game/game-types` bridge; `Category`/`GameLanguage`
  still come from there (not yet assigned a slice).
  `game-engine.ts` also had its `@/lib/db`/`@/providers/*` bridge imports
  repointed directly to `@/entities/word`/`@/entities/custom-word`.
  **A real runtime circular import came out of this move, not just a
  bridge-tidiness issue:** `LANGUAGES`/`DEFAULT_LANGUAGE` used to live in
  `game-rules.ts`; `entities/settings` needs them too, and importing
  them from a `features/` slice into an `entities/` slice is both a
  layer-direction violation and (since `game-engine.ts` itself imports
  `getSettings` from `entities/settings`) a genuine circular import.
  Fixed by moving `LANGUAGES`/`DEFAULT_LANGUAGE` into `game/game-types.ts`
  instead, alongside `GameLanguage` itself -- entities and features can
  both depend on that pre-FSD file without creating a cycle between
  each other.
  **A second, more subtle circular import:** `entities/statistics/model/
  statistics-record.ts` needs `getFinalPlayerResults`/
  `getFinalVotingHistory`/`getRoundSummary` from `final-results-flow.ts`.
  Importing them from the `@/features/play-round` barrel forces
  `game-engine.ts` to load too (a barrel's `export *` evaluates every
  source it re-exports, regardless of which name was actually
  imported) -- and `game-engine.ts` has eager top-level side effects
  (`new AiWordProvider()`, `new IndexedDbCacheProvider()`, etc.) that,
  via `@/lib/db`'s re-export bridge to `entities/statistics`, loop back
  into the very module still mid-evaluation. Symptom: `"IndexedDbCacheProvider
  is not a constructor"`, and only in whichever test happened to enter
  the cycle from that direction first. Fixed with a deliberate deep
  import straight to `@/features/play-round/model/final-results-flow`
  (documented inline in `statistics-record.ts`) instead of the barrel --
  final-results-flow.ts's own dependency chain never reaches
  `game-engine.ts` or `entities/statistics`, so this breaks the cycle
  cleanly. `game-statistics-store.ts`'s `FinalOutcome` import stays on
  the barrel since it's `import type`-only and erased at compile time,
  so it was never actually part of the runtime cycle.
  **Repointed 48 external consumers** across `components/`, `lib/`,
  `entities/`, and `test/` from the nine old `@/game/*` paths to
  `@/features/play-round`.

## Planned slices (not yet moved — see `../ARCHITECTURE.md`)

- `features/manage-players` — add/remove/reorder/validate players
- `features/configure-game` — category/difficulty/mode/timer selection
- `features/reveal-role` — private role reveal during pass-the-phone
- `features/cast-vote` — vote selection + confirmation
- `features/manage-custom-words` — custom words CRUD
- `features/install-pwa` — install prompt
- `features/register-service-worker`
- `features/toggle-preferences` — language/preferences toggles
- `features/reset-game-data`
- `features/recover-active-game`

Import from other layers: `entities/`, `shared/`.
