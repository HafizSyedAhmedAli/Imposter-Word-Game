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
    Also bridges the other way, temporarily importing
    `GameLanguage`/`VotingHistoryEntry` back from `game/game-types.ts`
    until `voting-history` exists (see `entities/README.md`).
  - `entities/game-session` (done) — `GameMode`, `Difficulty`,
    `TimerSettings`, `GameOptions`, `GameConfig`, `GameSession` moved
    from `game/game-types.ts`, which now re-exports them as a
    temporary bridge. `entities/round` was repointed to import
    `GameConfig` from here directly instead of via that bridge.
  - **Next:** `word`, `custom-word`, `achievement`, `statistics`,
    `voting-history`, per the migration plan tracked in project
    memory.
