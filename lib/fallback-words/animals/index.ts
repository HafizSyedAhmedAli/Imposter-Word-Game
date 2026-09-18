// lib/fallback-words/animals/index.ts

import type { FallbackWordEntry } from "../types";
import { ANIMALS_ENGLISH_FALLBACK_WORDS } from "./english";
import { ANIMALS_URDU_FALLBACK_WORDS } from "./urdu";

/**
 * TIER 3 static fallback entries for the "animals" category.
 *
 * Split into ./english/ and ./urdu/ (100 entries each, 200 total) so
 * each language's word list can be read, reviewed, or extended on its
 * own -- this file is just the concatenation of the two, and is what
 * ../index.ts imports.
 */
export const ANIMALS_FALLBACK_WORDS: FallbackWordEntry[] = [
  ...ANIMALS_ENGLISH_FALLBACK_WORDS,
  ...ANIMALS_URDU_FALLBACK_WORDS,
];
