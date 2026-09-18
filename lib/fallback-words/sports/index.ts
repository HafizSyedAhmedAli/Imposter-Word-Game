import type { FallbackWordEntry } from "../types";
import { SPORTS_ENGLISH_FALLBACK_WORDS } from "./english";
import { SPORTS_URDU_FALLBACK_WORDS } from "./urdu";

/**
 * TIER 3 static fallback entries for the "sports" category.
 *
 * Split into ./english/ and ./urdu/ (100 entries each, 200 total) so
 * each language's word list can be read, reviewed, or extended on its
 * own -- this file is just the concatenation of the two, and is what
 * ../index.ts imports (`import { SPORTS_FALLBACK_WORDS } from "./sports"`
 * resolves to this file automatically, so nothing outside this folder
 * needed to change).
 */
export const SPORTS_FALLBACK_WORDS: FallbackWordEntry[] = [
  ...SPORTS_ENGLISH_FALLBACK_WORDS,
  ...SPORTS_URDU_FALLBACK_WORDS,
];
