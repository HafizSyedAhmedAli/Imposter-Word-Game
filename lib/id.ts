/**
 * Generates a stable, locally-unique ID. Used for Player IDs so they never
 * depend on array position (see game-types.ts -- Player.id must survive
 * reordering/randomization untouched).
 *
 * Prefers crypto.randomUUID(); falls back to a timestamp + random string
 * for environments where it's unavailable, since this must work fully
 * offline with no external dependency.
 */
export function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
