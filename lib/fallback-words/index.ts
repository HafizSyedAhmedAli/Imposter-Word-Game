import type { Category, Difficulty, GameLanguage } from "@/game/game-types";
import { getRecentWordIds, rememberWordId } from "../recent-words";
import type { FallbackWordEntry } from "./types";
import { FOOD_FALLBACK_WORDS } from "./food";
import { ANIMALS_FALLBACK_WORDS } from "./animals";
import { SPORTS_FALLBACK_WORDS } from "./sports";
import { MOVIES_FALLBACK_WORDS } from "./movies";
import { COUNTRIES_FALLBACK_WORDS } from "./countries";
import { VEHICLES_FALLBACK_WORDS } from "./vehicles";
import { JOBS_FALLBACK_WORDS } from "./jobs";
import { NATURE_FALLBACK_WORDS } from "./nature";
import { EVERYDAY_THINGS_FALLBACK_WORDS } from "./everyday-things";
import { TECHNOLOGY_FALLBACK_WORDS } from "./technology";
import { PLACES_FALLBACK_WORDS } from "./places";
import { RANDOM_OBJECTS_FALLBACK_WORDS } from "./random-objects";

// Re-exported so existing callers (e.g. providers/fallback-word-provider.ts,
// tests) that do `import { FallbackWordEntry } from "@/lib/fallback-words"`
// keep working unchanged -- this directory is a drop-in replacement for
// the single file it replaced.
export type { FallbackWordEntry };

/**
 * TIER 3 -- STATIC FALLBACK (final emergency fallback only).
 *
 * This array ships in the application bundle and is used ONLY when both
 * of these have failed:
 *   1. AI generation
 *   2. The IndexedDB AI-cache lookup (see lib/db.ts)
 *
 * IMPORTANT: entries here must NEVER be written into IndexedDB. The
 * cache in lib/db.ts is reserved exclusively for real AI-generated
 * content (`source: "ai"`). Keeping this array separate is what lets
 * Screen 4 tell the difference between "this round came from the AI
 * cache" and "this round came from the last-resort static list" (see
 * providers/fallback-word-provider.ts and providers/indexeddb-cache-provider.ts).
 *
 * Deliberately generic/non-branded terms (e.g. "Sequel" instead of an
 * actual movie title) so nothing here depends on third-party IP. Covers
 * every category from game/game-rules.ts across all three difficulties,
 * so a total-failure round is never a degraded experience.
 *
 * Roman Urdu coverage mirrors the English list exactly (same 12
 * categories x 3 difficulties) -- so getRandomFallbackWord never has to
 * relax category/difficulty just because Roman Urdu was selected (spec:
 * "Offline Roman Urdu must work ... enough entries to make offline
 * Roman Urdu mode practically usable"). The Roman Urdu *word*
 * deliberately stays the same common term as its English counterpart in
 * most cases (e.g. "Pizza") -- only the hint is written in natural
 * Roman Urdu -- matching spec section 5 ("Roman Urdu mode does NOT mean
 * every word must be translated").
 *
 * MODULARITY: each category's entries live in their own file in this
 * directory (./food.ts, ./animals.ts, ...) so a single category can be
 * read, reviewed, or extended without scrolling past the other eleven.
 * This array is just the concatenation of all of them -- add a new
 * category by creating its file (English block, then Roman Urdu block,
 * same shape as the existing ones) and adding it to the list below.
 */
export const FALLBACK_WORDS: FallbackWordEntry[] = [
  ...FOOD_FALLBACK_WORDS,
  ...ANIMALS_FALLBACK_WORDS,
  ...SPORTS_FALLBACK_WORDS,
  ...MOVIES_FALLBACK_WORDS,
  ...COUNTRIES_FALLBACK_WORDS,
  ...VEHICLES_FALLBACK_WORDS,
  ...JOBS_FALLBACK_WORDS,
  ...NATURE_FALLBACK_WORDS,
  ...EVERYDAY_THINGS_FALLBACK_WORDS,
  ...TECHNOLOGY_FALLBACK_WORDS,
  ...PLACES_FALLBACK_WORDS,
  ...RANDOM_OBJECTS_FALLBACK_WORDS,
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Picks a random entry from the static fallback array, matching
 * category + difficulty + language as closely as possible via graceful
 * tiers:
 *
 *   1. Exact category + difficulty + language, excluding recently used
 *      words
 *   2. Exact category + difficulty + language (recent words allowed)
 *
 * `language` is matched exactly and never relaxed -- a Roman Urdu
 * selection must never silently fall back to an English entry (spec:
 * "LANGUAGE-AWARE WORD SELECTION" / "Do not silently fall back to
 * English if Roman Urdu was selected"). Both the English and Roman Urdu
 * blocks in every category file above cover the exact same
 * category/difficulty grid, so in practice this never needs to fall
 * through further than tier 2.
 *
 * This function is synchronous and can never fail for a supported
 * language -- `FALLBACK_WORDS` is a non-empty compile-time constant
 * covering every real category/difficulty for both languages, so tier 2
 * always has something to return for a valid category/difficulty pair.
 */
export function getRandomFallbackWord(
  category: Category,
  difficulty: Difficulty,
  /** Defaults to "english" so pre-existing callers keep their exact
   * original behavior. */
  language: GameLanguage = "english",
): FallbackWordEntry {
  const isRandomCategory = category === "random";
  const matching = FALLBACK_WORDS.filter(
    (w) =>
      (isRandomCategory || w.category === category) &&
      w.difficulty === difficulty &&
      w.language === language,
  );

  if (matching.length === 0) {
    throw new Error(
      `No fallback word available for category "${category}", difficulty "${difficulty}", and language "${language}".`,
    );
  }

  const recentIds = new Set(getRecentWordIds());
  const nonRecent = matching.filter((w) => !recentIds.has(w.id));
  const pool = nonRecent.length > 0 ? nonRecent : matching;

  const entry = pickRandom(pool);
  rememberWordId(entry.id);

  return entry;
}
