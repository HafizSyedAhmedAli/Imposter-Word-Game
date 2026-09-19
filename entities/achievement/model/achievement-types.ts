// entities/achievement/model/achievement-types.ts

/**
 * One (local player, achievement) unlock -- the Achievements feature's
 * only persisted state. Every achievement *condition* is derived purely
 * from `completedGames` (see ./achievement-engine.ts) -- this table
 * exists only to (a) remember the moment an achievement was first
 * earned (`unlockedAt`, shown on the Achievements screen) and (b) let
 * ./achievement-store.ts tell which achievements are genuinely NEW
 * after a given game, so the unlock notification never re-fires for one
 * already earned. It is never the source of truth for whether an
 * achievement is unlocked -- the Achievements screen always recomputes
 * that live from `completedGames`, so a failed/missing write here can
 * never make an actually-earned achievement look locked.
 *
 * Primary-keyed by `id` = `${normalizedName}::${achievementId}` -- the
 * same "put is naturally idempotent" trick `CompletedGameRecord` (in
 * lib/db.ts) uses: recording the same unlock twice overwrites the same
 * row instead of creating a duplicate, with no separate dedupe
 * bookkeeping required.
 *
 * The Dexie table itself (`achievementUnlocks`, with its v8 schema) is
 * still declared in lib/db.ts, which imports this type -- see
 * ../../README.md.
 */
export type AchievementUnlockRecord = {
  id: string;
  achievementId: string;
  /** Cross-game identity key -- same convention as
   * `CompletedGamePlayerResult.normalizedName` in lib/db.ts. */
  normalizedName: string;
  /** Display name as of the moment this achievement unlocked. */
  displayName: string;
  unlockedAt: number;
};
