import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { POST } from "@/app/api/round/generate/route";

/**
 * Covers the Custom Words hint-only branch added to
 * app/api/round/generate/route.ts (providers/custom-word-provider.ts's
 * `requestHintForWord` is the only real caller). A `word` field in the
 * request body must produce a hint *for that exact word* -- never a
 * newly-invented word/hint pair, which is what this route did before
 * the fix (it silently ignored `word` and returned an unrelated random
 * round, so a Custom Word's Imposter hint had nothing to do with the
 * actual secret word).
 */

function mockGeminiOnce(hint: string) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [
        { content: { parts: [{ text: JSON.stringify({ hint }) }] } },
      ],
    }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/round/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.GEMINI_API_KEY;
});

describe("POST /api/round/generate -- Custom Words hint-only mode", () => {
  it("returns a hint for the exact supplied word, not a newly-invented word", async () => {
    const fetchMock = mockGeminiOnce("Often shared during casual gatherings.");

    const response = await POST(
      makeRequest({ word: "Pizza", difficulty: "medium", language: "english" }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ hint: "Often shared during casual gatherings." });

    // The prompt sent to the AI must reference the supplied word --
    // this is the actual regression check: before the fix, the route
    // never even looked at `word` and asked the AI to invent its own.
    const requestedBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    const promptText = requestedBody.contents[0].parts[0].text;
    expect(promptText).toContain("Pizza");
  });

  it("never returns a hint that reveals the supplied word", async () => {
    mockGeminiOnce("A Pizza is a popular Italian dish.");

    const response = await POST(
      makeRequest({ word: "Pizza", difficulty: "medium", language: "english" }),
    );

    // validateRoundContent rejects a hint containing the word -- the
    // route must surface that as a failure, not silently ship a hint
    // that gives the word away.
    expect(response.status).toBe(502);
  });

  it("does not require category, and still scopes the hint to the word", async () => {
    const fetchMock = mockGeminiOnce(
      "A vast, cold expanse beyond our atmosphere.",
    );

    const response = await POST(
      makeRequest({ word: "Space", difficulty: "hard", language: "english" }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hint).toBe("A vast, cold expanse beyond our atmosphere.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls through to the normal round-generation path when no word is supplied", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    word: "Nebula",
                    hint: "A cloud in space.",
                  }),
                },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({
        category: "random",
        difficulty: "medium",
        language: "english",
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ word: "Nebula", hint: "A cloud in space." });
  });

  it("returns 503 when the API key is not configured, same as the normal path", async () => {
    delete process.env.GEMINI_API_KEY;

    const response = await POST(
      makeRequest({ word: "Pizza", difficulty: "medium", language: "english" }),
    );

    expect(response.status).toBe(503);
  });
});
