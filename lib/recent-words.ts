// lib/recent-words.ts
const RECENT_WORDS_KEY = "iw:recent-word-ids";
const RECENT_WORDS_LIMIT = 10;

/**
 * Session-scoped "don't repeat this word again immediately" tracking.
 * Deliberately capped and ordered (most-recent-first) -- this is only
 * ever meant to answer "was this shown a moment ago?", not "was this
 * shown at all this session?". See `getShownWordIds` below for the
 * latter; do not widen this cap to make exhaustion detection work, it
 * has its own dedicated, uncapped tracker for that.
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

const SHOWN_WORDS_KEY = "iw:shown-word-ids";

/**
 * Session-scoped "has this exact cached/fallback row already been shown
 * this session?" tracking. Unlike `getRecentWordIds` above, this is
 * deliberately UNCAPPED: `lib/db.ts`'s `getRandomCachedWord` and
 * `lib/fallback-words/index.ts`'s `getRandomFallbackWord` both need to
 * detect when *every* matching row for a category/difficulty/language
 * has already been shown, so a small cache pool (or even a single
 * 20-entry static category/difficulty pool) doesn't quietly start
 * repeating words just because more than `RECENT_WORDS_LIMIT` distinct
 * rows have been shown this session. A capped/ordered list can't answer
 * that question -- older entries would silently "become new again" once
 * evicted -- so this is a plain unordered set instead, populated by the
 * same `rememberWordId` call site as the capped list above.
 */
export function getShownWordIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(SHOWN_WORDS_KEY);
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
  try {
    const shown = getShownWordIds();
    if (!shown.includes(id)) {
      shown.push(id);
      sessionStorage.setItem(SHOWN_WORDS_KEY, JSON.stringify(shown));
    }
  } catch {
    // Best-effort only, same reasoning as above -- exhaustion detection
    // degrading is never a reason to block a round from starting.
  }
}

const RECENT_WORD_TEXT_KEY = "iw:recent-word-text";
const RECENT_WORD_TEXT_LIMIT = 30;

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
 * cache or fallback tier still gets excluded from a *future* AI call
 * too, not just AI-to-AI repeats.
 *
 * Deliberately `localStorage`, NOT `sessionStorage` like the other two
 * trackers above: this list is the ONLY thing standing between the AI
 * and repeating itself, since tier 1 has no persistent pool for
 * `getRandomCachedWord`'s usageCount/lastUsedAt strategy to work
 * against. If this lived in sessionStorage, every new browser
 * session -- i.e. every new day for a group that closes the app
 * overnight -- would silently forget every word it had ever told the
 * AI to avoid, and a category/difficulty prompt that tends to collapse
 * onto one "obvious" answer (e.g. Food/Easy) would produce that same
 * answer again the next time it's played. `localStorage` has no
 * per-session lifetime, so the exclusion list -- and therefore the
 * no-repeat guarantee -- survives closing the tab/app and carries into
 * tomorrow's rounds. `getRecentWordIds`/`getShownWordIds` above stay on
 * `sessionStorage` on purpose: they gate tier 2/3's *pre-existing* row
 * pools, which already have their own persistent cross-session
 * dedupe/LRU (`WordEntry.usageCount`/`lastUsedAt` in lib/db.ts) --
 * making their session-only exclusion permanent too would eventually
 * exhaust every cached row and force every round to fall through to
 * tier 3 forever.
 */
export function getRecentWordText(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_WORD_TEXT_KEY);
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
    localStorage.setItem(RECENT_WORD_TEXT_KEY, JSON.stringify(recent));
  } catch {
    // Best-effort only, same reasoning as rememberWordId above.
  }
}

// lib/recent-words.ts (append at end of file, after rememberWordText)

/**
 * Clears all three recent-word trackers above (including the uncapped
 * shown-word-ids set). Part of "Reset Game Data" (see
 * lib/reset-game-data.ts) -- without this, a reset round could still
 * feel non-random immediately afterwards, since these "don't repeat"
 * lists would otherwise survive the reset untouched. `recentWordText`
 * lives in `localStorage` (see its doc comment above) while the other
 * two stay in `sessionStorage`, so each is cleared from the store it's
 * actually written to.
 */
export function clearRecentWords(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(RECENT_WORDS_KEY);
    localStorage.removeItem(RECENT_WORD_TEXT_KEY);
    sessionStorage.removeItem(SHOWN_WORDS_KEY);
  } catch {
    // Best-effort only, same reasoning as rememberWordId above.
  }
}
