# widgets

Composed UI blocks tied to a specific screen's layout — not independent
capabilities (that's `features/`), not full routes (that's `pages/`).

## Done

- `widgets/vote-panel` — `VoteScreen`, moved from
  `components/vote/VoteScreen.tsx` unchanged apart from import fixes.
  With `features/cast-vote` already extracted (step 6), nothing but
  this screen orchestrator itself was left to move -- there was no
  separate "panel" composition beyond the screen. Public API:
  `@/widgets/vote-panel` (barrel re-exporting `VoteScreen` as a named
  export). `app/voting/page.tsx` repointed.

- `widgets/pass-phone-panel` — `PassPhoneScreen`, moved from
  `components/pass/PassPhoneScreen.tsx` unchanged apart from import
  fixes. Same situation as `vote-panel`: `features/reveal-role` and
  `shared/ui/LeaveRoundDialog` already covered everything else in
  `components/pass/`. Public API: `@/widgets/pass-phone-panel` (barrel
  re-exporting `PassPhoneScreen`). `app/pass/page.tsx` repointed.

  **Both slices surfaced the same shared dependency:** both screens
  (plus four more not yet migrated -- `DiscussionScreen`,
  `ResultsScreen`, `RoundPreparationScreen`, `FinalResultsScreen`)
  imported `components/round/RoundPreparationHeader.tsx`. It takes only
  an `onBack` callback, no domain type, so -- same reasoning as
  `PlayerAvatar`/`LeaveRoundDialog` -- it moved to
  `shared/ui/RoundPreparationHeader.tsx` instead of into either widget,
  with all six real consumers repointed now rather than leaving the
  other four on a stale path for whichever future widget slice gets to
  them. (`components/how-to-play/HowToPlayHeader.tsx` only *mentions*
  it in a comment and was never an importer.)

- `widgets/discussion-panel` — `DiscussionScreen` plus its five
  supporting cards (`DiscussionControls`, `DiscussionPlayersCard`,
  `DiscussionStatusCard`, `DiscussionTimer`, `DiscussionTipsCard`),
  moved from `components/game/` as one unit -- unlike `vote-panel`/
  `pass-phone-panel`, none of these six files had already been claimed
  by a `features/*` slice in step 6, so there was no single leftover
  orchestrator file; the whole screen and its cards moved together.
  Checked each of the five cards for reuse elsewhere before moving
  (none found), so none needed a `shared/ui/` detour the way
  `PlayerAvatar`/`RoundPreparationHeader` did. Public API:
  `@/widgets/discussion-panel` (barrel re-exporting `DiscussionScreen`).
  `app/game/page.tsx` repointed.

- `widgets/results-panel` — `ResultsScreen` plus its two exclusive
  supporting cards (`MostVotedCard`, `TieCard`, `VerdictCard`), moved
  from `components/results/` as one unit, same as `discussion-panel`.
  `VoteResultsCard` was the odd one out: it's also used by the
  not-yet-migrated `components/final-results/FinalResultsScreen.tsx`,
  so -- same reasoning as `RoundPreparationHeader` -- it moved to
  `shared/ui/VoteResultsCard.tsx` instead of into this widget, with
  both real consumers (this widget and `FinalResultsScreen`) repointed
  now rather than leaving `final-results-panel` on a stale path.
  Public API: `@/widgets/results-panel` (barrel re-exporting
  `ResultsScreen`). `app/results/page.tsx` repointed.

- `widgets/round-preparation-panel` — `RoundPreparationScreen` plus its
  six supporting files (`GameSummaryCard`, `PreparationAnimation`,
  `PreparationProgress`, `PreparationStatus`, `RoundSourceIndicator`,
  `RoundErrorRecovery`), moved from `components/round/` as one unit --
  none had consumers outside that directory, same situation as
  `discussion-panel`. `RoundPreparationHeader` was already in
  `shared/ui/` from the `vote-panel`/`pass-phone-panel` slice, so no
  new extraction was needed here. Public API:
  `@/widgets/round-preparation-panel` (barrel re-exporting
  `RoundPreparationScreen`). `app/round/page.tsx` repointed.

## Planned slices (not yet moved — see `../ARCHITECTURE.md`)

- `widgets/final-results-panel`
- `widgets/statistics-panel`, `widgets/achievements-panel`

Import from other layers: `features/`, `entities/`, `shared/`.