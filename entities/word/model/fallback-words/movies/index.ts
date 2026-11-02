// lib/fallback-words/movies/index.ts

import type { FallbackWordEntry } from "../types";
import { MOVIES_ENGLISH_FALLBACK_WORDS } from "./english";
import { MOVIES_URDU_FALLBACK_WORDS } from "./urdu";

/**
 * TIER 3 static fallback entries for the "movies" category.
 *
 * Split into ./english/ and ./urdu/ (100 entries each, 200 total) so
 * each language's word list can be read, reviewed, or extended on its
 * own -- this file is just the concatenation of the two, and is what
 * ../index.ts imports.
 */
export const MOVIES_FALLBACK_WORDS: FallbackWordEntry[] = [
  ...MOVIES_ENGLISH_FALLBACK_WORDS,
  ...MOVIES_URDU_FALLBACK_WORDS,
];
