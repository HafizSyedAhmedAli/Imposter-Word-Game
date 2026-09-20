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

- `features/reset-game-data` — the "Reset Game Data" (Settings screen)
  orchestration, moved from `lib/reset-game-data.ts` unchanged apart
  from import fixes. Public API: `@/features/reset-game-data` (barrel
  at `features/reset-game-data/index.ts`, re-exporting the single
  `resetGameData` function from `model/reset-game-data.ts`). Its four
  still-unmigrated dependencies (`resetUserData`/`clearCustomWords`
  from `lib/db`, `resetAchievements` from `lib/achievements/store`,
  `clearRecentWords`, `clearStoredRoundSession`) stay temporary bridges
  via absolute `@/lib/*` imports, same pattern used throughout this
  migration; `resetStatistics`/`resetSettings` already imported from
  their own entity slices and needed no change. Old file deleted (no
  bridge left behind) — its two real consumers,
  `components/settings/SettingsScreen.tsx` and
  `test/lib/reset-game-data.test.ts`, were repointed directly. The test
  file itself was **not** relocated to `test/features/` — per the
  established convention on this branch (see e.g.
  `test/lib/settings-store.test.ts`, still testing `entities/settings`),
  test-path relocation is deliberately deferred to step 10.

- `features/register-service-worker` — service worker registration +
  the "update ready" banner, moved from
  `components/pwa/ServiceWorkerRegister.tsx` unchanged apart from its
  new path. This is the first slice with a `ui/` segment (a React
  component) rather than a `model/`-only one — `features/play-round`
  and `features/reset-game-data` are pure logic, but a self-contained,
  independently-mountable capability like this one is still a
  `features/` slice per this file's own top-of-file rule, not
  `widgets/` (which is for screen-composed, non-reusable pieces).
  Public API: `@/features/register-service-worker` (barrel re-exporting
  the component as the named export `ServiceWorkerRegister`, since FSD
  barrels avoid default exports). Its one external consumer,
  `app/layout.tsx`, was repointed from a default import to this named
  one.

- `features/manage-players` — add/remove/reorder/validate players.
  Moved seven of the eight files from `components/players/`:
  `PlayersHeader.tsx`, `PlayerCount.tsx`, `PlayerInput.tsx`,
  `PlayerList.tsx`, `PlayerCard.tsx`, `PlayerValidationMessage.tsx`,
  `RandomizePlayersToggle.tsx`, `PlayersContinueButton.tsx` (all under
  the new `ui/` segment), unchanged apart from import-path fixes.
  Public API: `@/features/manage-players` (barrel re-exporting all of
  the above as named exports **except** `PlayerCard`, which stays an
  internal-only implementation detail of `PlayerList` — never imported
  outside this slice).
  **Two deliberate exceptions, not moved here:**
  - `PlayerAvatar.tsx` went to `shared/ui/PlayerAvatar.tsx` instead —
    it takes only a numeric `index`, no `Player` domain type, so it
    carries no domain knowledge (a genuine `shared/ui` candidate per
    `shared/README.md`'s own "if/when extracted" note), and it's
    reused well beyond the Players screen: voting, pass, discussion,
    results, and final-results cards all render it too. All 8
    consumers (7 external + `PlayerCard` itself) repointed to
    `@/shared/ui/PlayerAvatar`.
  - `PlayersScreen.tsx` and `GameConfigSummary.tsx` stay in
    `components/players/` for now. `PlayersScreen` is the /players
    route's screen orchestrator — composing this feature (and,
    eventually, `configure-game`) for one specific route is a
    `pages/players` concern (step 8), not this feature itself, per
    this file's own "screen-composed -> `widgets/`/`pages/`, not
    `features/`" rule; it was updated in place to import the moved
    pieces from `@/features/manage-players` instead of its old local
    relative paths. `GameConfigSummary` displays the chosen
    `GameConfig`, which belongs with the still-unmoved
    `features/configure-game` slice below, not this one — left
    untouched.
  **Not addressed by this move, flagged for a dedicated pass:**
  `addPlayer`/`editPlayer`/`removePlayer`/`randomizePlayers`/
  `resetPlayers`/`randomizeEnabled` all still live in the single
  `GameSetupProvider` (`lib/game-setup-context.tsx`), mounted once at
  the root layout and shared with the config half of setup state
  (`setMode`/`setCategory`/etc. — the planned `features/configure-game`
  slice). Splitting that one provider/one sessionStorage key
  (`lib/game-setup-store.ts`) into two feature-owned ones is a real,
  separate design decision (matching-key hydration ordering, whether
  each slice gets its own storage key or the two continue sharing one)
  and deliberately wasn't rushed alongside this move — `manage-players`
  keeps consuming `useGameSetup()` as a documented bridge, same
  exception pattern as `lib/db.ts`/`lib/analytics.ts` in
  `shared/README.md`, until `configure-game` exists and both slices'
  actual needs are known.
  **Unrelated dead-code finding, left alone (out of scope for this
  move):** `lib/game-setup-session-store.ts` is an orphaned duplicate
  of `lib/game-setup-store.ts` (same `sessionStorage` key, missing the
  later-added `randomizeEnabled` field) with zero remaining importers —
  worth deleting in a separate cleanup pass.

## Planned slices (not yet moved — see `../ARCHITECTURE.md`)

- `features/configure-game` — category/difficulty/mode/timer selection
- `features/reveal-role` — private role reveal during pass-the-phone
- `features/cast-vote` — vote selection + confirmation
- `features/manage-custom-words` — custom words CRUD
- `features/install-pwa` — install prompt
- `features/toggle-preferences` — language/preferences toggles
- `features/recover-active-game`

Import from other layers: `entities/`, `shared/`.