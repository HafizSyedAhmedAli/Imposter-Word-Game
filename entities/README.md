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

## Planned slices (not yet moved — see `../ARCHITECTURE.md`)

- `entities/player` — `Player` type, player Dexie CRUD
- `entities/round` — `RoundData`, `RoundSession`, `GeneratedRoundContent`,
  `RoundContentSource`, `game/round-validation.ts`
- `entities/game-session` — `GameSession`, `GameConfig`, `GameOptions`,
  `GameMode`, `Difficulty`, `TimerSettings`
- `entities/word` — `providers/word-provider.ts` and its
  ai/fallback/cache/custom implementations, `lib/fallback-words/`
- `entities/custom-word` — `game/custom-word-rules.ts` + `customWords` table
- `entities/achievement` — `lib/achievements/*`
- `entities/statistics` — `lib/statistics-aggregation.ts`, `statistics-record.ts`
- `entities/voting-history` — `VotingHistoryEntry`, `VotingHistoryTallyEntry`,
  `VotingHistoryVerdict`

Import from other layers: `shared/` only.
