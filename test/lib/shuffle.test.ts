import { describe, it, expect, vi, afterEach } from "vitest";
import { shuffle, rotate } from "@/shared/lib/shuffle";

describe("shuffle", () => {
  it("returns an array with the same elements, just reordered", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
    expect([...result].sort()).toEqual([...input].sort());
  });

  it("does not mutate the input array", () => {
    const input = [1, 2, 3];
    const original = [...input];
    shuffle(input);
    expect(input).toEqual(original);
  });

  it("handles an empty array without throwing", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("handles a single-element array without throwing", () => {
    expect(shuffle(["only"])).toEqual(["only"]);
  });
});

describe("rotate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves relative order (who follows whom), only changing where the list starts", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // offset = 1 + floor(0 * 2) = 1
    const result = rotate(["Ahmed", "Asmed", "Mali"]);
    expect(result).toEqual(["Asmed", "Mali", "Ahmed"]);
  });

  it("never returns offset 0 (a no-op rotation), even at the top of Math.random's range", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    const result = rotate(["Ahmed", "Asmed", "Mali"]);
    // offset = 1 + floor(0.999999 * 2) = 2
    expect(result).toEqual(["Mali", "Ahmed", "Asmed"]);
    expect(result).not.toEqual(["Ahmed", "Asmed", "Mali"]);
  });

  it("does not mutate the input array", () => {
    const input = ["Ahmed", "Asmed", "Mali"];
    const original = [...input];
    rotate(input);
    expect(input).toEqual(original);
  });

  it("returns a shallow copy for a single-element array (nothing to rotate)", () => {
    const input = ["only"];
    const result = rotate(input);
    expect(result).toEqual(["only"]);
    expect(result).not.toBe(input);
  });

  it("returns a shallow copy for an empty array", () => {
    expect(rotate([])).toEqual([]);
  });

  it("every possible offset keeps the circular order intact for a larger list", () => {
    const input = ["a", "b", "c", "d", "e"];
    for (let i = 0; i < 20; i++) {
      const result = rotate(input);
      // The result must be some rotation of the circular sequence
      // a-b-c-d-e-a-b-c-d-e..., and must never equal the identity.
      const doubled = [...input, ...input].join(",");
      expect(doubled).toContain(result.join(","));
      expect(result).not.toEqual(input);
    }
  });
});
