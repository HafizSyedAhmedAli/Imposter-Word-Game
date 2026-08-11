/**
 * Returns a new array with items in random order using an unbiased
 * Fisher-Yates shuffle. Does not mutate the input array. Runs entirely
 * locally -- no network, no AI -- so "Randomize Order" works offline.
 */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
