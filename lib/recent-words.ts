const RECENT_WORDS_KEY = "iw:recent-word-ids";
const RECENT_WORDS_LIMIT = 10;

/**
 * Session-scoped "don't repeat this word again immediately" tracking.
 * Shared across every word source (AI cache, static fallback) so a
 * player never sees the same word twice in a row regardless of which
 * tier it came from -- see lib/db.ts and lib/fallback-words.ts.
 */
export function getRecentWordIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(RECENT_WORDS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}
export function rememberWordId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const recent = [
      id,
      ...getRecentWordIds().filter((existing) => existing !== id),
    ].slice(0, RECENT_WORDS_LIMIT);
    sessionStorage.setItem(RECENT_WORDS_KEY, JSON.stringify(recent));
  } catch {
    // Best-effort only -- duplicate protection is a nice-to-have, never
    // something that should block a round from starting.
  }
}