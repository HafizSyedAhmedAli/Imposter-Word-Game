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

  // The hint must not simply give the word away.
  if (hint.toLowerCase().includes(word.toLowerCase())) {
    return { valid: false, reason: "Hint reveals the word." };
  }

  return { valid: true, word, hint };
}
