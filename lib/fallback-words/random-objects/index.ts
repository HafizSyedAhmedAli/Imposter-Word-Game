import type { FallbackWordEntry } from "../types";
import { RANDOM_OBJECTS_ENGLISH_FALLBACK_WORDS } from "./english";
import { RANDOM_OBJECTS_URDU_FALLBACK_WORDS } from "./urdu";

/**
 * TIER 3 static fallback entries for the "random-objects" category.
 *
 * Split into ./english/ and ./urdu/ (100 entries each, 200 total) so
 * each language's word list can be read, reviewed, or extended on its
 * own -- this file is just the concatenation of the two, and is what
 * ../index.ts imports (`import { RANDOM_OBJECTS_FALLBACK_WORDS } from "./random-objects"`
 * resolves to this file automatically, so nothing outside this folder
 * needed to change).
 */
export const RANDOM_OBJECTS_FALLBACK_WORDS: FallbackWordEntry[] = [
  ...RANDOM_OBJECTS_ENGLISH_FALLBACK_WORDS,
  ...RANDOM_OBJECTS_URDU_FALLBACK_WORDS,
];
