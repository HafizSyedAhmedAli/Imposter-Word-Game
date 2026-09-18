import type { FallbackWordEntry } from "../types";
import { FOOD_ENGLISH_FALLBACK_WORDS } from "./english";
import { FOOD_URDU_FALLBACK_WORDS } from "./urdu";

/**
 * TIER 3 static fallback entries for the "food" category.
 *
 * Split into ./english/ and ./urdu/ (100 entries each, 200 total) so
 * each language's word list can be read, reviewed, or extended on its
 * own -- this file is just the concatenation of the two, and is what
 * ../index.ts imports (`import { FOOD_FALLBACK_WORDS } from "./food"`
 * resolves to this file automatically, so nothing outside this folder
 * needed to change).
 */
export const FOOD_FALLBACK_WORDS: FallbackWordEntry[] = [
  ...FOOD_ENGLISH_FALLBACK_WORDS,
  ...FOOD_URDU_FALLBACK_WORDS,
];
