import type { FallbackWordEntry } from "../types";
import { PLACES_ENGLISH_FALLBACK_WORDS } from "./english";
import { PLACES_URDU_FALLBACK_WORDS } from "./urdu";

/**
 * TIER 3 static fallback entries for the "places" category.
 *
 * Split into ./english/ and ./urdu/ (100 entries each, 200 total) so
 * each language's word list can be read, reviewed, or extended on its
 * own -- this file is just the concatenation of the two, and is what
 * ../index.ts imports (`import { PLACES_FALLBACK_WORDS } from "./places"`
 * resolves to this file automatically, so nothing outside this folder
 * needed to change).
 */
export const PLACES_FALLBACK_WORDS: FallbackWordEntry[] = [
  ...PLACES_ENGLISH_FALLBACK_WORDS,
  ...PLACES_URDU_FALLBACK_WORDS,
];
