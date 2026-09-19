# entities

Domain models and their own data access — one folder per domain concept,
each exposing a single `index.ts` public API.

Planned slices (not yet moved — see `../ARCHITECTURE.md`):

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
- `entities/settings` — `lib/settings-store.ts` + `settings` table
- `entities/voting-history` — `VotingHistoryEntry`, `VotingHistoryTallyEntry`,
  `VotingHistoryVerdict`

Import from other layers: `shared/` only.
