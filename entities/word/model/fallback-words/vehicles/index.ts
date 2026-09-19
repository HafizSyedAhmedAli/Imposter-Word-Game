// lib/fallback-words/vehicles/index.ts
import type { FallbackWordEntry } from "../types";
import { VEHICLES_ENGLISH_FALLBACK_WORDS } from "./english";
import { VEHICLES_URDU_FALLBACK_WORDS } from "./urdu";

/**
 * TIER 3 static fallback entries for the "vehicles" category.
 *
 * Split into ./english/ and ./urdu/ (100 entries each, 200 total) so
 * each language's word list can be read, reviewed, or extended on its
 * own.
 */
export const VEHICLES_FALLBACK_WORDS: FallbackWordEntry[] = [
  ...VEHICLES_ENGLISH_FALLBACK_WORDS,
  ...VEHICLES_URDU_FALLBACK_WORDS,
];
