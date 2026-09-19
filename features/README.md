# features

One independent, user-facing capability per slice, each exposing a single
`index.ts` public API. If a piece of UI/logic only makes sense composed
inside one specific screen (not reusable as a standalone capability), it's a
`widgets/` concern instead, not a feature.

Planned slices (not yet moved — see `../ARCHITECTURE.md`):

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
- `features/play-round` — cross-entity round orchestration currently in
  `game/game-engine.ts`, `game-rules.ts`, `role-assignment.ts`,
  `elimination.ts`, `discussion-flow.ts`, `pass-flow.ts`, `vote-flow.ts`,
  `results-flow.ts`, `final-results-flow.ts`. Highest-risk slice — migrate last.

Import from other layers: `entities/`, `shared/`.
