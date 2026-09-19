// entities/player/model/player-types.ts

/**
 * A player's public identity only. Screen 3 (Players) is the only place
 * this type is constructed -- it deliberately carries no secret game
 * state (no role, word, hint, or imposter flag). That information is
 * added later, per-round, by the Round Provider in Screen 4+.
 *
 * Moved from game/game-types.ts as part of the entities/player slice --
 * see ../../README.md. `game/game-types.ts` re-exports this type as a
 * temporary bridge so the ~40 existing consumers that still import
 * `Player` from `@/game/game-types` keep working unchanged.
 */
export type Player = {
  id: string;
  name: string;
};
