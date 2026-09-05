// game/round-validation.ts
import { GameLanguage } from "./game-types";

const MIN_WORD_LENGTH = 2;
const MAX_WORD_LENGTH = 40;
const MAX_WORD_TOKENS = 3;
const MAX_HINT_LENGTH = 160;

export type RoundContentCandidate = {
  word?: unknown;
  hint?: unknown;
};

export type RoundContentValidation =
  | { valid: true; word: string; hint: string }
  | { valid: false; reason: string };

/**
 * Validates a candidate word/hint pair before it's ever attached to a
 * round. Used by both the AI API route (server-side, before returning a
 * response -- see app/api/round/generate/route.ts) and the AI provider
 * client-side as defense in depth (see providers/ai-word-provider.ts).
 * Never throws -- callers decide what to do with a failed validation
 * (retry, fall back to local content, etc.).
 */
export function validateRoundContent(
  candidate: RoundContentCandidate,
  language: GameLanguage = "english",
): RoundContentValidation {
  const word = typeof candidate.word === "string" ? candidate.word.trim() : "";
  const hint = typeof candidate.hint === "string" ? candidate.hint.trim() : "";

  if (!word) return { valid: false, reason: "Word is empty." };
  if (!hint) return { valid: false, reason: "Hint is empty." };

  if (word.length < MIN_WORD_LENGTH || word.length > MAX_WORD_LENGTH) {
    return { valid: false, reason: "Word length is out of range." };
  }
  if (word.trim().split(/\s+/).length > MAX_WORD_TOKENS) {
    return { valid: false, reason: "Word is not a short, recognizable term." };
  }
  if (hint.length > MAX_HINT_LENGTH) {
    return { valid: false, reason: "Hint is too long." };
  }

  if (hint.toLowerCase().includes(word.toLowerCase())) {
    return { valid: false, reason: "Hint reveals the word." };
  }

  if (
    language === "roman-urdu" &&
    (containsNonLatinScript(word) || containsNonLatinScript(hint))
  ) {
    return {
      valid: false,
      reason: "Roman Urdu content must use Latin letters only.",
    };
  }

  return { valid: true, word, hint };
}

/**
 * Matches Urdu/Arabic script (U+0600-U+06FF, U+0750-U+077F, U+08A0-U+08FF,
 * presentation forms U+FB50-U+FDFF and U+FE70-U+FEFF) and Devanagari
 * (U+0900-U+097F). Roman Urdu mode must use Latin letters only (see
 * app/api/round/generate/route.ts's prompt and
 * providers/ai-word-provider.ts's client-side defense in depth) --
 * this is the single shared definition of "non-Latin script" both of
 * those use, so the rule can't drift between server and client.
 */
const NON_LATIN_SCRIPT_PATTERN =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0900-\u097F]/;

export function containsNonLatinScript(text: string): boolean {
  return NON_LATIN_SCRIPT_PATTERN.test(text);
}

/**
 * A small set of English function words that essentially never appear
 * in genuine Roman Urdu (a Roman Urdu sentence borrows English nouns
 * freely -- "phone", "internet" -- but not English grammar words like
 * "the"/"was"/"which"). Matched on word boundaries so it doesn't
 * false-positive on Roman Urdu words that merely contain these letters
 * as a substring.
 */
const ENGLISH_STOPWORD_PATTERN =
  /\b(the|is|are|was|were|this|that|these|those|and|with|of|our|your|their|his|her|its|from|into|about|because|which|who|whom|whose|will|would|should|could|there|been|being|have|has|had|not|but|for|you|they)\b/gi;

/**
 * Flags a hint that reads as plain English rather than Roman Urdu --
 * the failure mode behind the original bug report: the model ignores
 * the Roman Urdu instruction and returns a fluent English sentence
 * (e.g. "The star that warms our planet.") which is still pure Latin
 * script, so `containsNonLatinScript` alone can't catch it. Requires
 * 2+ distinct stopword matches (not just 1) so a single incidental
 * English loanword in an otherwise-Urdu sentence doesn't get rejected
 * -- keeps this in the same spirit as the "not overly aggressive"
 * script check above.
 */
export function looksLikeEnglishNotRomanUrdu(text: string): boolean {
  const matches = text.match(ENGLISH_STOPWORD_PATTERN) ?? [];
  const uniqueMatches = new Set(matches.map((word) => word.toLowerCase()));
  return uniqueMatches.size >= 2;
}

/**
 * Validates that a Roman Urdu hint is actually written in Latin
 * characters AND doesn't just read as plain English (see
 * `looksLikeEnglishNotRomanUrdu` above -- the real cause of the "hint
 * shown in English despite Roman Urdu being selected" bug). Still
 * deliberately narrow -- it never rejects ordinary punctuation or
 * genuine Roman Urdu text itself (spec: "do not implement an overly
 * aggressive validator"). Never throws; callers (the API route and
 * AiWordProvider) decide whether to retry or fall through to the next
 * tier.
 */
export function validateRomanUrduHint(hint: string): {
  valid: boolean;
  reason?: string;
} {
  if (containsNonLatinScript(hint)) {
    return {
      valid: false,
      reason: "Roman Urdu hint contains non-Latin script.",
    };
  }
  if (looksLikeEnglishNotRomanUrdu(hint)) {
    return {
      valid: false,
      reason: "Roman Urdu hint reads as plain English, not Roman Urdu.",
    };
  }
  return { valid: true };
}
