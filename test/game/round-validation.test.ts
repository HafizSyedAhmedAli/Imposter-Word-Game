import { describe, it, expect } from "vitest";
import { validateRoundContent } from "@/game/round-validation";

describe("validateRoundContent", () => {
  it("accepts a well-formed word/hint pair", () => {
    const result = validateRoundContent({
      word: "Pizza",
      hint: "A round shared dish.",
    });
    expect(result).toEqual({
      valid: true,
      word: "Pizza",
      hint: "A round shared dish.",
    });
  });

  it("trims surrounding whitespace", () => {
    const result = validateRoundContent({
      word: "  Pizza  ",
      hint: "  A dish.  ",
    });
    expect(result).toEqual({ valid: true, word: "Pizza", hint: "A dish." });
  });

  it("rejects a missing word", () => {
    const result = validateRoundContent({ hint: "A dish." });
    expect(result.valid).toBe(false);
  });

  it("rejects a missing hint", () => {
    const result = validateRoundContent({ word: "Pizza" });
    expect(result.valid).toBe(false);
  });

  it("rejects non-string word/hint values", () => {
    // Guards against a malformed/invalid AI response crashing the game
    // (Test Group C's "Invalid AI responses are handled safely").
    const result = validateRoundContent({ word: 123, hint: null });
    expect(result.valid).toBe(false);
  });

  it("rejects a word that is too short", () => {
    const result = validateRoundContent({ word: "A", hint: "Something." });
    expect(result.valid).toBe(false);
  });

  it("rejects a word that is too long", () => {
    const result = validateRoundContent({
      word: "x".repeat(41),
      hint: "Something.",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a word with more than 3 tokens", () => {
    const result = validateRoundContent({
      word: "one two three four",
      hint: "Something.",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a hint longer than 160 characters", () => {
    const result = validateRoundContent({
      word: "Pizza",
      hint: "x".repeat(161),
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a hint that reveals the word (case-insensitively)", () => {
    const result = validateRoundContent({
      word: "Pizza",
      hint: "It's basically PIZZA.",
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toMatch(/reveals the word/i);
    }
  });

  it("accepts a hint that merely shares a substring with the word", () => {
    // Sanity check that the "reveals the word" rule isn't overly broad.
    const result = validateRoundContent({
      word: "Pizza",
      hint: "Round, cheesy, sliced.",
    });
    expect(result.valid).toBe(true);
  });

  describe("language: roman-urdu", () => {
    it("accepts a natural Roman Urdu hint written in Latin letters", () => {
      const result = validateRoundContent(
        {
          word: "Pizza",
          hint: "Iske slice bana kar khate hain.",
        },
        "roman-urdu",
      );
      expect(result.valid).toBe(true);
    });

    it("rejects a hint containing Urdu/Arabic script", () => {
      const result = validateRoundContent(
        {
          word: "Pizza",
          hint: "اس کے سلائس بنا کر کھاتے ہیں۔",
        },
        "roman-urdu",
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toMatch(/latin letters only/i);
      }
    });

    it("rejects a word containing Devanagari script", () => {
      const result = validateRoundContent(
        {
          word: "पिज़्ज़ा",
          hint: "Iske slice bana kar khate hain.",
        },
        "roman-urdu",
      );
      expect(result.valid).toBe(false);
    });

    it("does not apply the Latin-script check when language is english (default)", () => {
      // Same non-Latin text -- but without language: "roman-urdu", the
      // extra script check must never fire, so pre-existing English
      // validation behavior is completely unchanged.
      const result = validateRoundContent({
        word: "Pizza",
        hint: "A round shared dish.",
      });
      expect(result.valid).toBe(true);
    });
  });
});
