import type { FallbackWordEntry } from "../types";
import { TECHNOLOGY_ENGLISH_FALLBACK_WORDS } from "./english";
import { TECHNOLOGY_URDU_FALLBACK_WORDS } from "./urdu";

/**
 * TIER 3 static fallback entries for the "technology" category.
 *
 * Split into ./english/ and ./urdu/ (100 entries each, 200 total) so
 * each language's word list can be read, reviewed, or extended on its
 * own -- this file is just the concatenation of the two, and is what
 * ../index.ts imports (`import { TECHNOLOGY_FALLBACK_WORDS } from "./technology"`
 * resolves to this file automatically, so nothing outside this folder
 * needed to change).
 */
export const TECHNOLOGY_FALLBACK_WORDS: FallbackWordEntry[] = [
  ...TECHNOLOGY_ENGLISH_FALLBACK_WORDS,
  ...TECHNOLOGY_URDU_FALLBACK_WORDS,
];
