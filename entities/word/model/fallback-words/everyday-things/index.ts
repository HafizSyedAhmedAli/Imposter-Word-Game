// lib/fallback-words/everyday-things/index.ts

import type { FallbackWordEntry } from "../types";
import { EVERYDAY_THINGS_ENGLISH_FALLBACK_WORDS } from "./english";
import { EVERYDAY_THINGS_URDU_FALLBACK_WORDS } from "./urdu";

/**
 * TIER 3 static fallback entries for the "everyday-things" category.
 *
 * Split into ./english/ and ./urdu/ (100 entries each, 200 total) so
 * each language's word list can be read, reviewed, or extended on its
 * own -- this file is just the concatenation of the two, and is what
 * ../index.ts imports.
 */
export const EVERYDAY_THINGS_FALLBACK_WORDS: FallbackWordEntry[] = [
  ...EVERYDAY_THINGS_ENGLISH_FALLBACK_WORDS,
  ...EVERYDAY_THINGS_URDU_FALLBACK_WORDS,
];
