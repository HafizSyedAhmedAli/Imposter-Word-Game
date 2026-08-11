import type { Player, PlayerRole } from "./game-types";
import { shuffle } from "@/lib/shuffle";

/**
 * Randomly assigns exactly `imposterCount` players the "imposter" role and
 * everyone else "player", using the same unbiased Fisher-Yates shuffle as
 * the Players screen (see lib/shuffle.ts). Never uses array index, name,
 * or insertion order to decide roles -- every player has an equal chance
 * of being picked.
 *
 * Output preserves the original player order -- only the *selection* of
 * who becomes an imposter is randomized, not the order of the result.
 */
export function assignRoles(
  players: Player[],
  imposterCount: number,
): PlayerRole[] {
  if (imposterCount < 0 || imposterCount > players.length) {
    throw new Error(
      `Invalid imposter count: ${imposterCount} for ${players.length} players.`,
    );
  }

  const shuffled = shuffle(players);
  const imposterIds = new Set(
    shuffled.slice(0, imposterCount).map((p) => p.id),
  );

  return players.map((p) => ({
    playerId: p.id,
    role: imposterIds.has(p.id) ? "imposter" : "player",
  }));
}
