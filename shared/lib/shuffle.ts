// lib/shuffle.ts
/**
 * Returns a new array with items in random order using an unbiased
 * Fisher-Yates shuffle. Does not mutate the input array. Runs entirely
 * locally -- no network, no AI -- so role assignment works offline.
 */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Returns a new array rotated by a random offset, circular-list style:
 * the relative order (who follows whom) never changes, only *where the
 * list starts* does. E.g. for [Ahmed, Asmed, Mali], the only three
 * possible outputs are:
 *   [Ahmed, Asmed, Mali]  (offset 0 -- excluded, see below)
 *   [Asmed, Mali, Ahmed]  (offset 1)
 *   [Mali, Ahmed, Asmed]  (offset 2)
 * Offset 0 (no-op) is deliberately excluded so every activation of the
 * Players screen's randomize toggle actually changes the order. Does
 * not mutate the input array.
 */
export function rotate<T>(items: T[]): T[] {
  if (items.length < 2) return [...items];
  const offset = 1 + Math.floor(Math.random() * (items.length - 1));
  return [...items.slice(offset), ...items.slice(0, offset)];
}