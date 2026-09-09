import { describe, it, expect } from "vitest";
import {
  validateCustomWordText,
  MAX_CUSTOM_WORD_LENGTH,
} from "@/game/custom-word-rules";

describe("validateCustomWordText", () => {
  it("accepts a normal word", () => {
    const result = validateCustomWordText("Pizza", []);
    expect(result).toEqual({ valid: true, value: "Pizza" });
  });

  it("trims leading/trailing whitespace", () => {
    const result = validateCustomWordText("  Biryani  ", []);
    expect(result).toEqual({ valid: true, value: "Biryani" });
  });

  it("rejects an empty word", () => {
    const result = validateCustomWordText("", []);
    expect(result.valid).toBe(false);
  });

  it("rejects a whitespace-only word", () => {
    const result = validateCustomWordText("     ", []);
    expect(result.valid).toBe(false);
  });

  it("rejects a word over the max length", () => {
    const tooLong = "a".repeat(MAX_CUSTOM_WORD_LENGTH + 1);
    const result = validateCustomWordText(tooLong, []);
    expect(result.valid).toBe(false);
  });

  it("accepts a word right at the max length", () => {
    const exact = "a".repeat(MAX_CUSTOM_WORD_LENGTH);
    const result = validateCustomWordText(exact, []);
    expect(result.valid).toBe(true);
  });

  it("allows a legitimate longer phrase", () => {
    const result = validateCustomWordText("New York City", []);
    expect(result).toEqual({ valid: true, value: "New York City" });
  });

  it("detects a case-insensitive duplicate", () => {
    const existing = [{ normalizedWord: "pizza" }];
    expect(validateCustomWordText("Pizza", existing).valid).toBe(false);
    expect(validateCustomWordText("pizza", existing).valid).toBe(false);
    expect(validateCustomWordText(" PIZZA ", existing).valid).toBe(false);
  });

  it("preserves the user's preferred capitalization when valid", () => {
    const result = validateCustomWordText("InterStellar", []);
    expect(result).toEqual({ valid: true, value: "InterStellar" });
  });

  it("does not flag a different word as a duplicate", () => {
    const existing = [{ normalizedWord: "pizza" }];
    const result = validateCustomWordText("Pasta", existing);
    expect(result.valid).toBe(true);
  });
});
