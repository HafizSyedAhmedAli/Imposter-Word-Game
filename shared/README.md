# shared

Framework-agnostic, domain-agnostic code: no knowledge of Player, Round,
Word, or any other game concept lives here. If a file needs to import from
`entities/`, `features/`, `widgets/`, or `pages/`, it does not belong in
`shared/`.

## Done

- `shared/lib/id.ts`, `shuffle.ts`, `haptics.ts`, `sound-engine.ts`,
  `connectivity.ts`, `rate-limit.ts`, `offline-navigation.ts`,
  `use-online-status.ts`, `use-app-router.ts`, `app-routes.ts` — moved from
  `lib/`, verified domain-agnostic (no imports of game types), all consumers
  repointed to `@/shared/lib/*`.

## Deliberately NOT moved yet

- **`lib/analytics.ts`, `lib/monitoring.ts`** — these import domain types
  (`Category`, `Difficulty`, `GameMode`, `RoundContentSource`, `GameLanguage`,
  `FinalOutcome` from `@/game/game-types` and `@/game/final-results-flow`) for
  typed event/error payloads. Moving them into `shared/` as-is would violate
  this layer's own "no domain knowledge" rule. Revisit once `entities/round`
  and `entities/game-session` exist — either the domain types move with them
  and analytics/monitoring stay a documented exception, or the typed event
  catalog gets split into the owning entity/feature slices and `shared/`
  keeps only the raw PostHog/Sentry plumbing.
- **`lib/db.ts`** — the shared Dexie instance. Imports domain types
  (`Player`, `CompletedGamePlayerResult`, etc.) for its table typings, so it
  has the same domain-coupling issue as analytics/monitoring above. Stays in
  `lib/` for now rather than moving into `shared/api/db` under false
  pretenses; each entity slice will wrap just its own table access once
  entities exist, and `db.ts` itself either moves once those wrappers make it
  domain-agnostic, or stays as a documented infrastructure exception.
- `shared/ui/` — UI with no domain meaning. Currently: `PlayerAvatar`
  (numeric `index` only) and `LeaveRoundDialog` (`onCancel`/`onConfirm`
  only; shared by the five in-round screens).

Import from other layers: **none**. Nothing above `shared/` may be imported here.
