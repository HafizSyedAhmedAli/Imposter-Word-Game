import { describe, it, expect, vi, afterEach } from "vitest";
import { generateId } from "@/lib/id";

describe("generateId", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uses crypto.randomUUID when it's available", () => {
    const spy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("11111111-1111-1111-1111-111111111111");

    expect(generateId()).toBe("11111111-1111-1111-1111-111111111111");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("falls back to a timestamp + random string when crypto.randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", {});

    const id = generateId();

    expect(id).toMatch(/^id-[a-z0-9]+-[a-z0-9]+$/);
  });

  it("falls back correctly when crypto itself is undefined", () => {
    vi.stubGlobal("crypto", undefined);

    const id = generateId();

    expect(id).toMatch(/^id-[a-z0-9]+-[a-z0-9]+$/);
  });

  it("generates unique values across repeated calls (no accidental caching)", () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateId()));
    expect(ids.size).toBe(20);
  });
});
