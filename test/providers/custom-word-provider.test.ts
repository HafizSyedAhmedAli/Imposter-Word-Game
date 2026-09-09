import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveCustomWordHint } from "@/providers/custom-word-provider";
import { getDb, addCustomWord, getCustomWords } from "@/lib/db";
import type { CustomWordEntry } from "@/lib/db";

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    value,
    configurable: true,
  });
}

function mockFetchOnce(
  response: Partial<Response> & { json?: () => Promise<unknown> },
) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    ...response,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function makeEntry(overrides: Partial<CustomWordEntry> = {}) {
  const result = await addCustomWord({
    word: overrides.word ?? "Biryani",
    category: "food",
    difficulty: "medium",
  });
  if (!result.ok) throw new Error("setup failed");
  return { ...result.entry, ...overrides };
}

afterEach(async () => {
  const db = getDb();
  await db.customWords.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setOnline(true);
});

describe("resolveCustomWordHint", () => {
  it("reuses an already-cached hint for the same word and language, without calling fetch", async () => {
    const entry = await makeEntry({
      hint: "A spiced rice dish.",
      hintLanguage: "english",
    });
    const fetchMock = mockFetchOnce({ json: async () => ({ hint: "unused" }) });

    const hint = await resolveCustomWordHint(entry, "english");

    expect(hint).toBe("A spiced rice dish.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not reuse a cached hint saved in a different language", async () => {
    const entry = await makeEntry({
      hint: "A spiced rice dish.",
      hintLanguage: "english",
    });
    mockFetchOnce({
      json: async () => ({ hint: "Chawal ki khaas dish." }),
    });

    const hint = await resolveCustomWordHint(entry, "roman-urdu");

    expect(hint).toBe("Chawal ki khaas dish.");
  });

  it("requests a fresh AI hint and persists it for future offline reuse", async () => {
    const entry = await makeEntry();
    const fetchMock = mockFetchOnce({
      json: async () => ({ hint: "A spiced rice dish." }),
    });

    const hint = await resolveCustomWordHint(entry, "english");

    expect(hint).toBe("A spiced rice dish.");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/round/generate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          word: "Biryani",
          difficulty: "medium",
          language: "english",
        }),
      }),
    );

    // Give the fire-and-forget persistence a tick to complete.
    await new Promise((resolve) => setTimeout(resolve, 0));
    const [saved] = await getCustomWords();
    expect(saved.hint).toBe("A spiced rice dish.");
    expect(saved.hintLanguage).toBe("english");
  });

  it("falls back to the generic hint when offline, without calling fetch", async () => {
    setOnline(false);
    const entry = await makeEntry();
    const fetchMock = mockFetchOnce({ json: async () => ({ hint: "unused" }) });

    const hint = await resolveCustomWordHint(entry, "english");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(hint.toLowerCase()).not.toContain("biryani");
    expect(hint.length).toBeGreaterThan(0);
  });

  it("falls back to the generic hint when the AI request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    const entry = await makeEntry();

    const hint = await resolveCustomWordHint(entry, "english");

    expect(hint.toLowerCase()).not.toContain("biryani");
  });

  it("falls back to the generic hint when the response is not ok", async () => {
    mockFetchOnce({ ok: false, status: 500 });
    const entry = await makeEntry();

    const hint = await resolveCustomWordHint(entry, "english");

    expect(hint.toLowerCase()).not.toContain("biryani");
  });

  it("never returns a hint that contains the word itself", async () => {
    const entry = await makeEntry({ word: "Pizza" });
    mockFetchOnce({ json: async () => ({ hint: "Everyone loves pizza." }) });

    const hint = await resolveCustomWordHint(entry, "english");

    // The AI response leaked the word, so it must be rejected in favor
    // of the generic fallback rather than returned as-is.
    expect(hint.toLowerCase()).not.toContain("pizza");
  });

  it("returns the language-appropriate generic hint for Roman Urdu", async () => {
    setOnline(false);
    const entry = await makeEntry();

    const hint = await resolveCustomWordHint(entry, "roman-urdu");

    expect(hint.length).toBeGreaterThan(0);
    expect(hint.toLowerCase()).not.toContain("biryani");
  });
});
