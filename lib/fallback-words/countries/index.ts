// lib/fallback-words/countries/index.ts

import type { FallbackWordEntry } from "../types";
import { COUNTRIES_ENGLISH_FALLBACK_WORDS } from "./english";
import { COUNTRIES_URDU_FALLBACK_WORDS } from "./urdu";

/**
 * TIER 3 static fallback entries for the "countries" category.
 *
 * Split into ./english/ and ./urdu/ (100 entries each, 200 total) so
 * each language's word list can be read, reviewed, or extended on its
 * own -- this file is just the concatenation of the two, and is what
 * ../index.ts imports.
 */
export const COUNTRIES_FALLBACK_WORDS: FallbackWordEntry[] = [
  ...COUNTRIES_ENGLISH_FALLBACK_WORDS,
  ...COUNTRIES_URDU_FALLBACK_WORDS,
];
