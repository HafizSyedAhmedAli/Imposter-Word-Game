# Architecture: Feature-Sliced Design migration

This project is migrating from a route-grouped structure (`app/`, `components/`,
`lib/`, `game/`, `providers/`) to Feature-Sliced Design (FSD). This is
**in progress** — most code still lives in the pre-FSD folders. New code should
land in the FSD layers below; existing code is migrated slice by slice.

## Layers (import direction is one-way, top to bottom)

```
app        (Next.js route segments — routing only, stays at repo root)
  ↓
pages      (one slice per route — composes widgets/features for a screen)
  ↓
widgets    (composed, screen-specific UI blocks — not reused across pages)
  ↓
features   (one independent user-facing capability per slice)
  ↓
entities   (domain models + their own data access — Player, Round, Word, ...)
  ↓
shared     (framework-agnostic utilities, no domain knowledge)
```

**Rule:** a slice may only import from layers below it (or from its own layer's
public API for cross-slice cases, sparingly). `entities/word` must never import
from `features/` or `widgets/`. `shared/` must never import from `entities/` or
above. This is what keeps the dependency graph acyclic as the app grows.

`app/*/page.tsx` files stay as thin shells: they import the matching slice from
`pages/` and render it. No business logic or composition lives in `app/`.

## Public API convention

Every slice (a folder under `entities/`, `features/`, `widgets/`, or `pages/`)
exposes its contents through a single `index.ts` barrel export. Code outside
the slice imports only from that barrel (`@/entities/player` not
`@/entities/player/model/player-store`) — this keeps a slice's internals free
to change without breaking consumers.

## Current status

- **Step 1 (done):** layer folders and path aliases scaffolded
  (`@/shared/*`, `@/entities/*`, `@/features/*`, `@/widgets/*`, `@/pages/*`).
- **Step 2 (done):** the ten framework-agnostic `lib/*` utilities moved into
  `shared/lib/` (see `shared/README.md` for the full list and for two
  deliberate exceptions — `lib/analytics.ts`, `lib/monitoring.ts`, and
  `lib/db.ts` stay put for now since they carry domain-type imports that
  `shared/` isn't supposed to have).
- **Step 3 (done):** `entities/settings` pilot slice moved from
  `lib/settings-store.ts` (see `entities/README.md` for the slice's two
  temporary bridge dependencies on `@/lib/db` and `@/game/*`).
- **Step 4 (in progress):** remaining `entities/*` slices, moved one at a
  time.
  - `entities/player` (done) — `Player` type moved from
    `game/game-types.ts`, which now re-exports it as a temporary bridge
    (see `entities/README.md`).
  - `entities/round` (done) — round-domain types and validation logic
    moved from `game/game-types.ts` and `game/round-validation.ts`,
    both of which now re-export from this slice as temporary bridges.
    Still bridges `GameLanguage` back from `game/game-types.ts`
    (`VotingHistoryEntry` no longer needs one -- see `entities/statistics`
    and `entities/voting-history` entries below).
  - `entities/game-session` (done) — `GameMode`, `Difficulty`,
    `TimerSettings`, `GameOptions`, `GameConfig`, `GameSession` moved
    from `game/game-types.ts`, which now re-exports them as a
    temporary bridge. `entities/round` was repointed to import
    `GameConfig` from here directly instead of via that bridge.
  - `entities/word` (done) — `WordProvider`, the AI / IndexedDB-cache /
    static-fallback providers, and the static fallback word list moved
    from `providers/` and `lib/fallback-words/`; the old paths re-export
    from this slice as temporary bridges. `lib/recent-words.ts`
    deliberately stays put for now, and `Category` stays in
    `game/game-types.ts` to avoid a `game-session` <-> `word`
    dependency cycle (see `entities/README.md`).
  - `entities/custom-word` (done) — `CustomWordEntry`, the validation
    rules, the Custom Words data access, and `resolveCustomWordHint`
    moved from `game/custom-word-rules.ts`, `providers/custom-word-provider.ts`,
    and `lib/db.ts`. The `customWords` table declaration stays in
    `lib/db.ts`, which re-exports the moved functions as a temporary
    bridge (a benign runtime cycle, documented in `entities/README.md`).
  - `entities/achievement` (done) — achievement definitions, evaluation
    engine, orchestration store, `AchievementUnlockRecord`, and the
    unlock data access moved from `lib/achievements/*` and `lib/db.ts`.
    The `achievementUnlocks` table declaration stays in `lib/db.ts`,
    which re-exports the moved functions (see `entities/README.md`).
  - `entities/statistics` (done) — `CompletedGamePlayerResult`,
    `CompletedGameRecord`, their CRUD, `statistics-aggregation.ts`,
    `statistics-record.ts`, and `game-statistics-store.ts` moved from
    `lib/db.ts`/`lib/`. The `completedGames` table declaration stays in
    `lib/db.ts`, same bridge pattern as `custom-word`. This is what let
    `entities/achievement` drop its own bridge and import this slice
    directly instead of going through `lib/statistics-aggregation`/
    `lib/game-statistics-store`.
  - `entities/voting-history` (done) — `VotingHistoryEntry`,
    `VotingHistoryTallyEntry`, `VotingHistoryVerdict` moved from
    `game/game-types.ts`, which now re-exports them as a temporary
    bridge. Pure types only; the orchestration logic that builds these
    lives in `features/play-round/model/results-flow.ts` (see below).
    This closes out every `entities/*` slice in the original plan.
  - `features/play-round` (done) -- the nine `game/*-flow.ts` +
    `game-engine.ts`/`game-rules.ts`/`role-assignment.ts`/`elimination.ts`
    orchestration files, moved as a single slice (highest-risk, saved
    for last on purpose). Surfaced two real runtime circular imports in
    the process, both fixed -- see `features/README.md` for the full
    trace (`LANGUAGES`/`DEFAULT_LANGUAGE` relocated to
    `game/game-types.ts`; `entities/statistics` deep-imports
    `final-results-flow.ts` directly instead of the barrel). 48
    external consumers repointed. Also fixed a pre-existing, unrelated
    `next build` failure in `components/pwa/MenuMusicController.tsx`
    (`usePathname()` can return `null`) while getting this slice's
    `next build` gate green.
  - `features/reset-game-data`, `features/register-service-worker`,
    `features/manage-players` (done) -- see `features/README.md`.
  - `features/configure-game` (done) -- the four Setup selectors, their
    internal cards, and `GameConfigSummary` moved from
    `components/setup/` / `components/players/`, plus the six pure
    `GameConfig` transitions extracted from `GameSetupProvider` into
    `model/config-updates.ts`. `GameSetupProvider` and
    `lib/game-setup-store.ts` deliberately stay in `lib/` for now (one
    provider / one storage key / one hydration flag shared by
    `manage-players` and this slice); the eventual home is
    `entities/game-session`, which needs `DEFAULT_GAME_CONFIG`,
    `CUSTOM_CATEGORY`, `MAX_PLAYERS` and `validatePlayerName` moved out
    of `features/play-round` first -- see `features/README.md`.
  - `features/reveal-role` (done) -- the five pass-the-phone reveal
    cards moved from `components/pass/`; `LeaveRoundDialog` went to
    `shared/ui/` (used by five screens). `PassPhoneScreen` stays for
    steps 7-8. See `features/README.md`.
  - `features/cast-vote` (done) -- the vote-screen cards and
    `VotingTimer` moved from `components/vote/`; `VoteScreen` stays for
    steps 7-8. See `features/README.md`.
  - `features/manage-custom-words` (done) -- the Custom Words screen's
    cards, list, header and delete dialog moved from
    `components/settings/custom-words/`; `CustomWordsScreen` stays for
    steps 7-8. See `features/README.md`.
  - `features/install-pwa` (done) -- install button/card, `appinstalled`
    analytics and `useInstallPrompt`; also deleted the leftover
    `components/pwa/ServiceWorkerRegister.tsx` copy. See
    `features/README.md`.
  - `features/toggle-preferences` (done) -- `PreferencesCard`,
    `LanguageCard` and `SettingsToggleRow` moved from
    `components/settings/`. See `features/README.md` (which also flags
    the `ResetGameDataCard`/`ResetGameDataDialog` follow-up).
  - `features/recover-active-game` (done) -- `GameRecoveryPrompt` moved
    from `components/home/`; the session/recovery storage
    (`round-session-store`, `active-game-recovery`) moved into
    `entities/round`, since it is `RoundSession` data access and the
    store's mirror call would otherwise point upward. Adds a test
    guarding "recovery never auto-resumes". Deleted the leftover
    `lib/reset-game-data.ts` copy. See `features/README.md`.
  - **Step 6 is complete.**
- **Step 7 (in progress):** `widgets/*`, moved one at a time.
  - `widgets/vote-panel`, `widgets/pass-phone-panel` (done) -- with
    `features/cast-vote`/`features/reveal-role` already extracted in
    step 6, each of these was just its one remaining screen-orchestrator
    file. Surfaced a shared dependency, `RoundPreparationHeader`, used
    by six screens with no domain type of its own -- moved to
    `shared/ui/` (all six consumers repointed) instead of duplicating
    it into a widget. See `widgets/README.md`.
  - `widgets/discussion-panel` (done) -- `DiscussionScreen` and its five
    supporting cards, moved as one unit from `components/game/` (none
    had already been claimed by a `features/*` slice, unlike
    vote/pass). None of the five cards were reused elsewhere. See
    `widgets/README.md`.
  - `widgets/round-preparation-panel` (done) -- `RoundPreparationScreen`
    and its six supporting files, moved as one unit from
    `components/round/` (none had consumers elsewhere).
    `RoundPreparationHeader` was already in `shared/ui/` from the
    `vote-panel`/`pass-phone-panel` slice. See `widgets/README.md`.
  - **Next:** `results-panel`, `final-results-panel`,
    `statistics-panel`, `achievements-panel`.
