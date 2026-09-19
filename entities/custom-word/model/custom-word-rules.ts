// entities/custom-word/model/custom-word-rules.ts
/**
 * Pure validation for the Custom Words feature (Settings -> Custom
 * Words). Deliberately separate from game/round-validation.ts -- that
 * module validates *AI-generated* word/hint pairs (max 3 tokens, 40
 * chars, etc., tuned for "a single recognizable term the AI invented"),
 * which is a different, stricter shape than what a person should be
 * allowed to type in as their own custom word (spec: "do not make
 * custom words unusable for legitimate longer phrases").
 *
 * Moved here from `game/custom-word-rules.ts` (see entities/README.md).
 * Pure, synchronous domain rules live in this file, while the async
 * IndexedDB read/write lives in ./custom-word-store.ts and calls into
 * this module rather than duplicating the rules itself.
 */

/** Generous enough for a short phrase ("Interstellar", "New York City") without being unusable. */
export const MAX_CUSTOM_WORD_LENGTH = 60;

export type CustomWordValidation =
  | { valid: true; value: string }
  | { valid: false; error: string };

/**
 * A minimal shape validation needs from an existing saved custom word --
 * just enough to check for a duplicate, without this module depending on
 * the full `CustomWordEntry` type (./custom-word-types.ts), so the rules
 * stay a pure, dependency-free module.
 */
export type ExistingCustomWord = { normalizedWord: string };

/**
 * Validates a candidate custom word against the rules described in the
 * feature spec:
 *   - trims leading/trailing whitespace
 *   - rejects an empty or whitespace-only word
 *   - enforces a sensible max length (protects against pathological
 *     input; does not restrict legitimate longer phrases)
 *   - rejects a case-insensitive duplicate of an already-saved word
 *     ("Pizza" / "pizza" / " PIZZA " are the same custom word)
 *
 * The user's preferred capitalization is preserved in `value` -- only
 * the *comparison* against `existing` is case-insensitive, never the
 * stored/displayed text itself.
 *
 * Never throws -- callers (./custom-word-store.ts's `addCustomWord`)
 * decide what to do with a failed validation, same convention as
 * entities/round's `validateRoundContent` and game-rules.ts's
 * `validatePlayerName`.
 */
export function validateCustomWordText(
  word: string,
  existing: ExistingCustomWord[],
): CustomWordValidation {
  const trimmed = word.trim();

  if (!trimmed) {
    return { valid: false, error: "Enter a word." };
  }

  if (trimmed.length > MAX_CUSTOM_WORD_LENGTH) {
    return {
      valid: false,
      error: `Custom words can be up to ${MAX_CUSTOM_WORD_LENGTH} characters.`,
    };
  }

  const normalized = trimmed.toLowerCase();
  const isDuplicate = existing.some((w) => w.normalizedWord === normalized);
  if (isDuplicate) {
    return { valid: false, error: "You've already added this word." };
  }

  return { valid: true, value: trimmed };
}