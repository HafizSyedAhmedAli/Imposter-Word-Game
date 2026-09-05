import { describe, it, expect, vi, afterEach } from "vitest";
import { AiWordProvider } from "@/providers/ai-word-provider";

const provider = new AiWordProvider();

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

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

describe("AiWordProvider", () => {
  it("calls the server route and returns validated content on success", async () => {
    mockFetchOnce({
      json: async () => ({ word: "Nebula", hint: "A cloud in space." }),
    });

    const result = await provider.generateRoundContent("movies", "hard");
    expect(result).toEqual({
      word: "Nebula",
      hint: "A cloud in space.",
      source: "ai",
      language: "english",
    });
  });

  it("posts to /api/round/generate with category, difficulty, excludeWords, and language", async () => {
    const fetchMock = mockFetchOnce({
      json: async () => ({ word: "Nebula", hint: "A cloud in space." }),
    });

    await provider.generateRoundContent("movies", "hard", {
      excludeWords: ["comet"],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/round/generate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          category: "movies",
          difficulty: "hard",
          excludeWords: ["comet"],
          language: "english",
        }),
      }),
    );
  });

  it("posts the given language when one is provided", async () => {
    const fetchMock = mockFetchOnce({
      json: async () => ({
        word: "Pizza",
        hint: "Iske slice bana kar khate hain.",
      }),
    });

    const result = await provider.generateRoundContent("food", "easy", {
      language: "roman-urdu",
    });

    expect(result.language).toBe("roman-urdu");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/round/generate",
      expect.objectContaining({
        body: JSON.stringify({
          category: "food",
          difficulty: "easy",
          excludeWords: [],
          language: "roman-urdu",
        }),
      }),
    );
  });

  it("throws when the response is not ok", async () => {
    mockFetchOnce({ ok: false, status: 500 });
    await expect(provider.generateRoundContent("food", "easy")).rejects.toThrow(
      /round generation failed/i,
    );
  });

  it("throws when the response body fails schema validation", async () => {
    mockFetchOnce({ json: async () => ({ word: "", hint: "" }) });
    await expect(provider.generateRoundContent("food", "easy")).rejects.toThrow(
      /failed validation/i,
    );
  });

  it("throws when a roman-urdu response contains non-Latin script", async () => {
    mockFetchOnce({
      json: async () => ({ word: "Pizza", hint: "اردو رسم الخط میں اشارہ" }),
    });
    await expect(
      provider.generateRoundContent("food", "easy", { language: "roman-urdu" }),
    ).rejects.toThrow(/failed validation/i);
  });

  it("throws when fetch itself rejects (network failure)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    await expect(provider.generateRoundContent("food", "easy")).rejects.toThrow(
      /network down/i,
    );
  });

  it("aborts the request when an external signal is triggered", async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url, init) => {
        return new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      }),
    );

    const pending = provider.generateRoundContent("food", "easy", {
      signal: controller.signal,
    });
    controller.abort();

    await expect(pending).rejects.toThrow();
  });
});
