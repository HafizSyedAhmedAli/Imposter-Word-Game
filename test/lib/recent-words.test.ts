import { describe, it, expect } from "vitest";
import {
  getRecentWordIds,
  rememberWordId,
  getRecentWordText,
  rememberWordText,
  clearRecentWords,
} from "@/lib/recent-words";

describe("recent word IDs (sessionStorage)", () => {
  it("starts empty", () => {
    expect(getRecentWordIds()).toEqual([]);
  });

  it("remembers an id, most-recent first", () => {
    rememberWordId("a");
    rememberWordId("b");
    expect(getRecentWordIds()).toEqual(["b", "a"]);
  });

  it("moves a re-remembered id to the front instead of duplicating it", () => {
    rememberWordId("a");
    rememberWordId("b");
    rememberWordId("a");
    expect(getRecentWordIds()).toEqual(["a", "b"]);
  });

  it("caps the list at 10 entries", () => {
    for (let i = 0; i < 15; i++) rememberWordId(`id-${i}`);
    const ids = getRecentWordIds();
    expect(ids).toHaveLength(10);
    expect(ids[0]).toBe("id-14"); // most recent
  });

  it("ignores malformed stored JSON instead of throwing", () => {
    sessionStorage.setItem("iw:recent-word-ids", "{not valid json");
    expect(getRecentWordIds()).toEqual([]);
  });
});

describe("recent word text (sessionStorage)", () => {
  it("normalizes case before storing", () => {
    rememberWordText("PIZZA");
    expect(getRecentWordText()).toEqual(["pizza"]);
  });

  it("ignores empty/whitespace-only words", () => {
    rememberWordText("   ");
    expect(getRecentWordText()).toEqual([]);
  });

  it("caps the list at 8 entries", () => {
    for (let i = 0; i < 12; i++) rememberWordText(`word-${i}`);
    expect(getRecentWordText()).toHaveLength(8);
  });
});

describe("clearRecentWords", () => {
  it("clears both the id list and the text list", () => {
    rememberWordId("a");
    rememberWordText("pizza");
    clearRecentWords();
    expect(getRecentWordIds()).toEqual([]);
    expect(getRecentWordText()).toEqual([]);
  });
});
