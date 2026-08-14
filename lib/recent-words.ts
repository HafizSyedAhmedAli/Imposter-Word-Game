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

const RECENT_WORD_TEXT_KEY = "iw:recent-word-text";
const RECENT_WORD_TEXT_LIMIT = 8;

/**
 * The plain-text counterpart to `getRecentWordIds` above. Tiers 2/3
 * (IndexedDB cache, static fallback) already avoid repeats by filtering
 * candidate rows against `recentWordIds` -- that works because both
 * tiers pick from a fixed, pre-existing pool of `WordEntry` rows with
 * real IDs. Tier 1 (live AI generation) has no such pool to filter --
 * the AI *invents* a word on every call -- so the only way to steer it
 * away from a repeat is to tell it, in the prompt itself, which words
 * were just used. This tracks the actual word text (lowercased) for
 * exactly that purpose. See game/game-engine.ts's `getRoundContent`,
 * which is the single place that calls `rememberWordText` -- once,
 * after content is resolved from ANY tier -- so a word shown via the
 * cache or fallback tier still gets excluded from a *future* AI call in
 * the same session, not just AI-to-AI repeats.
 */
export function getRecentWordText(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(RECENT_WORD_TEXT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((word): word is string => typeof word === "string");
  } catch {
    return [];
  }
}

export function rememberWordText(word: string): void {
  if (typeof window === "undefined") return;
  const normalized = word.trim().toLowerCase();
  if (!normalized) return;
  try {
    const recent = [
      normalized,
      ...getRecentWordText().filter((existing) => existing !== normalized),
    ].slice(0, RECENT_WORD_TEXT_LIMIT);
    sessionStorage.setItem(RECENT_WORD_TEXT_KEY, JSON.stringify(recent));
  } catch {
    // Best-effort only, same reasoning as rememberWordId above.
  }
}
