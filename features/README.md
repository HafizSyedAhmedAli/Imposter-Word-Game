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

- `features/configure-game` — mode / category / difficulty / timer
  selection on the Setup screen. Moved from `components/setup/` and
  `components/players/`: `GameModeSelector`, `CategorySelector`,
  `DifficultySelector`, `GameOptions` (the four selectors the Setup
  screen composes), their internal cards (`GameModeCard`,
  `CategoryCard`, `DifficultyCard`, `MoreCategoriesSheet`,
  `TimerOption`, `mascots/*`), and `GameConfigSummary` (the read-only
  config recap on the Players screen — this resolves the deferral noted
  in the `manage-players` entry above). Everything under `ui/` moved
  with no content change apart from `CategorySelector`'s
  `getCustomWords` import, repointed from the `@/lib/db` bridge
  straight to `@/entities/custom-word`.
  Public API: `@/features/configure-game` (barrel at
  `features/configure-game/index.ts`) — the five components above plus
  the six pure config transitions below. `CategoryCard`,
  `DifficultyCard`, `GameModeCard`, `MoreCategoriesSheet`,
  `TimerOption` and the mascots are deliberately **not** exported;
  each is rendered by exactly one selector.
  **New `model/config-updates.ts`:** `withMode`, `withCategory`,
  `withCustomWordCategory`, `withDifficulty`, `withDiscussionTimer`,
  `withVotingTimer` — pure `GameConfig -> GameConfig` functions
  extracted from the inline `setConfig((prev) => ...)` callbacks in
  `GameSetupProvider`. Behaviour is identical; the point is that the
  `customWordCategory` invariant (any normal category selection clears
  it, only `withCustomWordCategory` sets it) now lives in this slice
  and is unit-tested without mounting React
  (`test/features/configure-game/config-updates.test.ts`).
  **Deliberately NOT moved: `GameSetupProvider` /
  `lib/game-setup-store.ts`.** With both `manage-players` and this
  slice done, the actual coupling is clear: the config half and the
  players half share one provider, one `sessionStorage` key
  (`iw:game-setup`) and one `isHydrated` flag, and
  `RoundPreparationScreen` reads both halves plus `isHydrated` in a
  single recovery effect — splitting them means changing hydration
  ordering, not just moving files. Moving the provider into either
  feature would also force the other to import it sideways
  (feature -> feature). Its correct home is `entities/game-session`
  (it is the in-progress `GameSession`), but that first needs
  `DEFAULT_GAME_CONFIG`, `CUSTOM_CATEGORY`, `MAX_PLAYERS` and
  `validatePlayerName` relocated out of `features/play-round` — an
  entity can't import from a feature. Tracked as its own follow-up
  step; until then the provider keeps consuming this slice's
  transitions (`lib/` -> `features/` is fine, `lib/` is not a layer).
  **Cross-slice imports (sparing, same as `manage-players`):**
  `@/features/play-round` for the static catalogs (`GAME_MODES`,
  `CATEGORIES`, `MORE_CATEGORIES`, `DIFFICULTIES`, timer option
  lists, `CUSTOM_CATEGORY`, `getGameConfigCategoryLabel`). Consumer
  repointed: `components/setup/GameSetupScreen.tsx`,
  `components/players/PlayersScreen.tsx`,
  `features/manage-custom-words/ui/AddCustomWordCard.tsx` (the last
  one imports `DifficultySelector`, now a feature -> feature import
  since `manage-custom-words` has moved; see its entry below).
  `SetupHeader`, `SetupSection`, `ContinueButton`, `PrivacyNotice`
  and `GameSetupScreen` stay in `components/setup/` — screen-composed
  pieces for the `/setup` route, i.e. `widgets/`/`pages/` (steps 7-8).

- `features/reveal-role` — the private role reveal during
  pass-the-phone. Moved five files from `components/pass/` into `ui/`,
  content unchanged apart from one import: `PassPromptCard`,
  `PrivateRevealPrompt`, `PlayerRevealCard`, `ImposterRevealCard`,
  `AllPlayersReadyCard` (`PassPromptCard`'s `Player` import now comes
  straight from `@/entities/player` instead of the `@/game/game-types`
  bridge). Public API: `@/features/reveal-role` (barrel at
  `features/reveal-role/index.ts`, all five as named exports).
  **The crew/imposter anti-tell invariant is unchanged and now lives
  in one slice:** `PlayerRevealCard` and `ImposterRevealCard` keep their
  own separate `CREW_REVEAL_DELAY_MS` / `REVEAL_HOLD_MS` literals (both
  3000 ms) on purpose -- `ImposterRevealCard` must never gain a `word`
  prop -- so any edit to one card's timing, progress markup or sound
  must be mirrored in the other. The barrel's header comment repeats
  this.
  **Also moved, out of this slice:** `components/pass/LeaveRoundDialog.tsx`
  went to `shared/ui/LeaveRoundDialog.tsx`. It takes only
  `onCancel`/`onConfirm` (no domain types) and is rendered by five
  screens (Pass Phone, Discussion, Voting, Results, Final Results), so
  it is a `shared/ui` primitive, same reasoning as `PlayerAvatar`
  above. All five consumers repointed.
  **Stays put:** `components/pass/PassPhoneScreen.tsx` -- the `/pass`
  route's screen orchestrator (round-session reads, pass-state machine,
  analytics, leave-guard), i.e. a `pages/`/`widgets/` concern (steps
  7-8). `lib/use-leave-round-back-guard.ts` also stays in `lib/`: it has
  no domain knowledge (Capacitor + history only) and is a natural
  `shared/lib` candidate, but it's a separate move from this slice.
  Consumer repointed: `components/pass/PassPhoneScreen.tsx`.

- `features/cast-vote` — private vote selection + confirmation
  during the Voting screen. Moved seven files from `components/vote/`
  into `ui/`, content unchanged apart from one import
  (`VoteSelectionCard`'s `Player` now comes from `@/entities/player`
  instead of the `@/game/game-types` bridge): `VotingPassPromptCard`,
  `VoteSelectionCard`, `ConfirmVoteCard`, `VoteRecordedCard`,
  `AllVotesCastCard`, `VotingTimer`, `TimesUpCard`. Public API:
  `@/features/cast-vote` (barrel at `features/cast-vote/index.ts`, the
  first six as named exports).
  **`TimesUpCard` is not exported because nothing renders it** -- it was
  already dead in `components/vote/` (`VoteScreen` handles expiry via
  `VotingTimer`'s `onExpire`); it moved with its folder rather than
  being deleted here, since removal wasn't part of this change. Safe to
  delete in a cleanup pass.
  **Stays put:** `components/vote/VoteScreen.tsx` -- the `/voting`
  route's orchestrator (round-session reads, vote-flow state,
  analytics, leave-guard), a `pages/`/`widgets/` concern (steps 7-8).
  Consumer repointed: `components/vote/VoteScreen.tsx`. The vote
  logic itself (`vote-flow.ts`) already lives in `features/play-round`.

- `features/manage-custom-words` — the Settings -> Custom Words
  screen's UI: add a word, list saved words, delete one. Moved five
  files from `components/settings/custom-words/` into `ui/`:
  `AddCustomWordCard`, `CustomWordCard`, `CustomWordList`,
  `CustomWordsHeader`, `DeleteCustomWordDialog` (the header moved for
  the same reason `PlayersHeader` went into `manage-players`).
  Public API: `@/features/manage-custom-words` (barrel at
  `features/manage-custom-words/index.ts`; `CustomWordCard` is internal
  to `CustomWordList` and not exported; the `AddCustomWordOutcome` type
  is).
  Import repoints made while touching these files, all to their owning
  entity instead of a bridge: `CustomWordEntry` and
  `MAX_CUSTOM_WORD_LENGTH` -> `@/entities/custom-word` (was `@/lib/db` /
  `@/game/custom-word-rules`), `Difficulty` -> `@/entities/game-session`.
  `CustomWordsScreen` got the same treatment for its
  `addCustomWord`/`deleteCustomWord`/`getCustomWords` imports.
  `game/custom-word-rules.ts` now has only test consumers left.
  **Cross-slice import, deliberate:** `AddCustomWordCard` renders
  `@/features/configure-game`'s `DifficultySelector` (same feature ->
  feature exception as `manage-players` -> `play-round`). It is a plain
  props-driven component with no setup-flow dependency, so duplicating
  it would only create drift; revisit if a third consumer appears
  (then it becomes a `shared/ui` question).
  **Stays put:** `components/settings/custom-words/CustomWordsScreen.tsx`
  (the `/settings/custom-words` orchestrator: load/add/delete state,
  haptics, error capture -- steps 7-8) and
  `components/settings/CustomWordsCard.tsx` (just the link row on the
  Settings screen, composed there like the other Settings cards).
  `DeleteCustomWordDialog` is structurally identical to
  `shared/ui/LeaveRoundDialog` and `ResetGameDataDialog` (native
  `<dialog>`); left as three copies, not merged in this move.

- `features/install-pwa` — the "Install App" capability: the home
  footer button, the Settings "Install App" card, the `appinstalled`
  analytics listener, and the browser install-prompt hook behind them.
  Moved: `lib/use-install-prompt.ts` -> `model/use-install-prompt.ts`
  (unchanged), and into `ui/`: `components/pwa/InstallAppButton.tsx`,
  `components/settings/InstallAppCard.tsx` (the Settings card holds the
  full installed / native-prompt / iOS-steps / fallback state machine,
  so it is this capability's UI, unlike the plain link row
  `CustomWordsCard` which stays with Settings), and
  `components/pwa/PwaInstallAnalytics.tsx` (mounted once in the root
  layout, renders nothing). The two UIs now import the hook by relative
  path (`../model/use-install-prompt`), and comment paths were updated.
  Public API: `@/features/install-pwa` (barrel at
  `features/install-pwa/index.ts`: `InstallAppButton`, `InstallAppCard`,
  `PwaInstallAnalytics`); `useInstallPrompt` is internal. Consumers
  repointed: `components/home/HomeFooter.tsx`,
  `components/settings/SettingsScreen.tsx`, `app/layout.tsx`.
  **Cleanup found in passing:** `components/pwa/ServiceWorkerRegister.tsx`
  was still on disk, an unimported leftover copy from the
  `register-service-worker` move (that slice's own file is what
  `app/layout.tsx` uses). Deleted here; also fixed the one stale path to
  it in `public/sw-template.js`'s comment.
  **Stays in `components/pwa/` (not install-related, app-level
  infrastructure):** `MenuMusicController` (the test in
  `test/pwa/menu-music-routes.test.ts` imports `MENU_ROUTES` from it),
  `NativeSplashScreenController`, `SoundProvider`, and `AppLink` (an
  offline-navigation `<Link>` wrapper with no domain knowledge, a
  `shared/ui` candidate; its only consumer today is `CategorySelector`).

- `features/toggle-preferences` — the Settings screen's preference
  controls: sound / music / haptics toggles and the round-content
  language picker. Moved three files from `components/settings/` into
  `ui/`, content unchanged: `PreferencesCard`, `LanguageCard`,
  `SettingsToggleRow` (the full-row switch `PreferencesCard` is built
  from; its only consumer). Public API: `@/features/toggle-preferences`
  (barrel at `features/toggle-preferences/index.ts`: `PreferencesCard`,
  `LanguageCard`; `SettingsToggleRow` is internal). The data side
  (`GameSettings`, `getSettings`/`updateSettings`) is the already-built
  `@/entities/settings`, which both cards import from directly; only
  `LANGUAGES`/`GameLanguage` still come from the `@/game/game-types`
  bridge. Consumer repointed: `components/settings/SettingsScreen.tsx`.
  **Stays in `components/settings/` (screen chrome / other capabilities):**
  `SettingsScreen` (route orchestrator, steps 7-8), `SettingsHeader`,
  `AboutCard`, `CustomWordsCard` (link rows).
  **Flagged, not done here:** `ResetGameDataCard` and
  `ResetGameDataDialog` are the UI for the already-migrated
  `features/reset-game-data` slice but still sit in
  `components/settings/`, and `ResetGameDataCard` imports the
  `ResetStatus` type *from* `SettingsScreen` (a child importing from its
  parent screen). Moving them into that slice needs `ResetStatus`
  relocated first; worth its own small step.

- `features/recover-active-game` — the "Game in Progress" prompt on
  Home. Moved `components/home/GameRecoveryPrompt.tsx` ->
  `features/recover-active-game/ui/GameRecoveryPrompt.tsx`; public API
  `@/features/recover-active-game` (barrel: `GameRecoveryPrompt`).
  Consumer repointed: `components/home/HomeScreen.tsx`.
  **The pass-the-phone rule is unchanged and now test-guarded:**
  recovery must always require a deliberate tap -- auto-resuming could
  put a role/word on screen in front of the wrong player. The prompt is a
  modal with no neutral dismiss (Escape is default-prevented) and
  restores nothing until "RESUME GAME" is pressed
  (`test/features/recover-active-game/recovery-prompt.test.tsx`).
  **The storage side moved into `entities/round`, not into this
  feature.** `lib/round-session-store.ts` ->
  `entities/round/model/round-session-store.ts` and
  `lib/active-game-recovery.ts` ->
  `entities/round/model/active-game-recovery.ts` (both content-unchanged
  apart from importing `RoundSession` from `./round-types` instead of
  the `@/game/game-types` bridge; their relative `./active-game-recovery`
  import kept working because they moved together). Why: this is data
  access for `RoundSession`, and `storeRoundSession()` is the single
  choke point that keeps the localStorage mirror in sync -- if the
  mirror lived in a feature, the round-session store (an entity, lower
  layer) would have to import upward. Public API additions on
  `@/entities/round`: `getStoredRoundSession`, `storeRoundSession`,
  `clearStoredRoundSession`, `getRecoverableActiveGame`,
  `markActiveGameRoute`, `clearActiveGameRecovery`, type
  `ActiveGameRoute` (`mirrorActiveGameSession` stays internal). Every
  consumer was repointed directly, no `lib/` bridge left behind: the
  six in-round screens (`RoundPreparationScreen`, `PassPhoneScreen`,
  `DiscussionScreen`, `VoteScreen`, `ResultsScreen`,
  `FinalResultsScreen`), `features/reset-game-data`, and two test files.
  **Second leftover duplicate deleted:** `lib/reset-game-data.ts` was
  still on disk (an unimported copy from the `reset-game-data` move --
  its relative `./round-session-store` import would have broken here).
  Comment paths that pointed at it were updated.
  **Still in `lib/`:** `use-leave-round-back-guard.ts` (Capacitor +
  history only, a `shared/lib` candidate).

## Step 6 is complete -- follow-ups noted along the way

None of these block step 7; each is a small, separate move:

- Relocate `GameSetupProvider` / `lib/game-setup-store.ts` into
  `entities/game-session`, after `DEFAULT_GAME_CONFIG`,
  `CUSTOM_CATEGORY`, `MAX_PLAYERS` and `validatePlayerName` move out of
  `features/play-round` (see the `configure-game` entry).
- Move `ResetGameDataCard` / `ResetGameDataDialog` into
  `features/reset-game-data`, after relocating the `ResetStatus` type
  out of `SettingsScreen` (see `toggle-preferences`).
- `lib/use-leave-round-back-guard.ts` -> `shared/lib` (see
  `reveal-role` / `recover-active-game`).
- `components/pwa/AppLink.tsx` -> `shared/ui` (see `install-pwa`).
- Delete the unused `features/cast-vote/ui/TimesUpCard.tsx` and the
  unused `lib/game-setup-session-store.ts`.
- Three near-identical native `<dialog>` copies (`LeaveRoundDialog`,
  `DeleteCustomWordDialog`, `ResetGameDataDialog`) could share one
  primitive.

Import from other layers: `entities/`, `shared/`.
