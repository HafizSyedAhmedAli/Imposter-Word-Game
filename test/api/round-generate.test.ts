import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST, OPTIONS } from "@/app/api/round/generate/route";
import { __resetRateLimitForTests } from "@/shared/lib/rate-limit";

/**
 * Covers everything test/api/round-generate-hint.test.ts doesn't:
 * the normal "AI invents a word" path (buildPrompt), Roman Urdu
 * validation/retry on both prompts, the exclude-words sanitization
 * logic, the OPTIONS preflight handler, and the failure/retry branches
 * of both requestRoundContent and requestHintForWord that weren't
 * exercised by the happy-path-only Custom Words tests.
 *
 * round-generate-hint.test.ts is left untouched -- this file is purely
 * additive coverage, not a replacement.
 */

type FetchResponseLike = {
  ok: boolean;
  status?: number;
  json?: () => Promise<unknown>;
};

function mockFetchSequence(responses: Array<FetchResponseLike | Error>) {
  const fetchMock = vi.fn();
  for (const response of responses) {
    if (response instanceof Error) {
      fetchMock.mockRejectedValueOnce(response);
    } else {
      fetchMock.mockResolvedValueOnce(response);
    }
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function geminiOk(payload: Record<string, unknown>): FetchResponseLike {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
    }),
  };
}

/** Simulates the model ignoring the "respond with ONLY JSON" instruction. */
function geminiRawText(rawText: string): FetchResponseLike {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: rawText }] } }],
    }),
  };
}

function geminiHttpError(status = 500): FetchResponseLike {
  return { ok: false, status };
}

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/round/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function promptFrom(
  fetchMock: ReturnType<typeof vi.fn>,
  callIndex = 0,
): string {
  const requestedBody = JSON.parse(fetchMock.mock.calls[callIndex][1].body);
  return requestedBody.contents[0].parts[0].text;
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-key";
  __resetRateLimitForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.GEMINI_API_KEY;
});

describe("OPTIONS /api/round/generate", () => {
  it("returns a 204 preflight response with the CORS headers the mobile build relies on", async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
      "POST",
    );
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
      "Content-Type",
    );
  });
});

describe("POST /api/round/generate -- malformed input", () => {
  it("returns 400 for a body that isn't valid JSON", async () => {
    const badRequest = new Request("http://localhost/api/round/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not valid json",
    });

    const response = await POST(badRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request body.");
  });
});

describe("POST /api/round/generate -- normal round generation (AI invents the word)", () => {
  it("defaults category to random and difficulty to medium when omitted", async () => {
    const fetchMock = mockFetchSequence([
      geminiOk({ word: "Kite", hint: "Flies on a string in the wind." }),
    ]);

    const response = await POST(makeRequest({ language: "english" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      word: "Kite",
      hint: "Flies on a string in the wind.",
    });
    expect(promptFrom(fetchMock)).toContain("any family-friendly category");
    expect(promptFrom(fetchMock)).toContain("Hint difficulty: medium");
  });

  it("passes the requested category through verbatim", async () => {
    const fetchMock = mockFetchSequence([
      geminiOk({ word: "Mango", hint: "A sweet tropical fruit." }),
    ]);

    await POST(makeRequest({ category: "food", difficulty: "hard" }));

    expect(promptFrom(fetchMock)).toContain("Category: food");
  });

  it("always requires a common, everyday word -- regardless of difficulty -- so difficulty can never inflate word obscurity", async () => {
    const fetchMock = mockFetchSequence([
      geminiOk({ word: "Bicycle", hint: "Has two wheels and pedals." }),
    ]);

    await POST(makeRequest({ category: "vehicles", difficulty: "hard" }));

    const promptText = promptFrom(fetchMock);
    expect(promptText).toMatch(/common, everyday word or concept/i);
    expect(promptText).toMatch(/never make the word itself more obscure/i);
  });

  it.each([
    ["easy", "very clear and directly helpful"],
    ["medium", "should not be obvious"],
    ["hard", "subtle and non-obvious"],
  ] as const)(
    "applies %s hint-difficulty guidance to the prompt",
    async (difficulty, expectedFragment) => {
      const fetchMock = mockFetchSequence([
        geminiOk({ word: "Sun", hint: "Gives us daylight." }),
      ]);

      await POST(makeRequest({ difficulty }));

      const promptText = promptFrom(fetchMock);
      expect(promptText).toContain(`Hint difficulty: ${difficulty}`);
      expect(promptText.toLowerCase()).toContain(expectedFragment);
    },
  );

  it("includes the exclusion list in the prompt when excludeWords are provided", async () => {
    const fetchMock = mockFetchSequence([
      geminiOk({ word: "Guitar", hint: "A stringed musical instrument." }),
    ]);

    await POST(makeRequest({ excludeWords: ["Piano", "Drums"] }));

    const promptText = promptFrom(fetchMock);
    expect(promptText).toContain("piano");
    expect(promptText).toContain("drums");
  });

  it("sanitizes excludeWords: trims/lowercases, dedupes, drops non-strings/empty/overlong entries, and caps at 8", async () => {
    const fetchMock = mockFetchSequence([
      geminiOk({ word: "Guitar", hint: "A stringed musical instrument." }),
    ]);
    const overlong = "x".repeat(101);

    await POST(
      makeRequest({
        excludeWords: [
          " Apple ",
          "apple",
          "APPLE", // all three collapse to one "apple" entry
          "Banana",
          123,
          null,
          undefined, // dropped -- not strings
          "",
          "   ", // dropped -- empty after trim
          overlong, // dropped -- exceeds max length
          "c1",
          "c2",
          "c3",
          "c4",
          "c5",
          "c6", // pushes the unique count past the 8-item cap
        ],
      }),
    );

    const promptText = promptFrom(fetchMock);
    expect(promptText).toContain("apple");
    expect(promptText).toContain("banana");
    expect(promptText).not.toContain(overlong);

    const exclusionLine =
      promptText.match(/must be avoided: (.+)\./)?.[1] ?? "";
    const items = exclusionLine.split(", ");
    expect(items.length).toBeLessThanOrEqual(8);
  });

  it("retries once when the first AI response fails validation, and returns the second attempt", async () => {
    const fetchMock = mockFetchSequence([
      geminiRawText("not json at all"),
      geminiOk({ word: "Lantern", hint: "Used to light up a dark room." }),
    ]);

    const response = await POST(makeRequest({}));
    const data = await response.json();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
    expect(data).toEqual({
      word: "Lantern",
      hint: "Used to light up a dark room.",
    });
  });

  it("retries when the first attempt returns a word already in excludeWords, and keeps the fresh second attempt", async () => {
    const fetchMock = mockFetchSequence([
      geminiOk({ word: "Pizza", hint: "A cheesy Italian dish." }),
      geminiOk({ word: "Sushi", hint: "Often served in bite-sized pieces." }),
    ]);

    const response = await POST(makeRequest({ excludeWords: ["Pizza"] }));
    const data = await response.json();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(data).toEqual({
      word: "Sushi",
      hint: "Often served in bite-sized pieces.",
    });
  });

  it("still returns a best-effort result if both attempts keep returning an excluded word", async () => {
    const fetchMock = mockFetchSequence([
      geminiOk({ word: "Pizza", hint: "A cheesy Italian dish." }),
      geminiOk({ word: "Pizza", hint: "A cheesy Italian dish." }),
    ]);

    const response = await POST(makeRequest({ excludeWords: ["Pizza"] }));
    const data = await response.json();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
    expect(data.word).toBe("Pizza");
  });

  it("never lets a hint that reveals the invented word through, even after a retry", async () => {
    const fetchMock = mockFetchSequence([
      geminiOk({ word: "Pizza", hint: "A Pizza is a popular Italian dish." }),
      geminiOk({ word: "Pizza", hint: "A Pizza is a popular Italian dish." }),
    ]);

    const response = await POST(makeRequest({}));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(502);
  });

  it("returns 502 when both attempts fail validation", async () => {
    const fetchMock = mockFetchSequence([
      geminiRawText("nope"),
      geminiRawText("still nope"),
    ]);

    const response = await POST(makeRequest({}));
    const data = await response.json();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(502);
    expect(data.error).toBe("Round generation failed.");
  });

  it("treats a non-object JSON response (e.g. a bare string) as a failed generation and retries", async () => {
    const fetchMock = mockFetchSequence([
      geminiRawText(JSON.stringify("just a string")),
      geminiOk({ word: "Lantern", hint: "Used to light up a dark room." }),
    ]);

    const response = await POST(makeRequest({}));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
  });

  it("returns 502 when Gemini responds with a non-OK HTTP status on both attempts", async () => {
    const fetchMock = mockFetchSequence([
      geminiHttpError(500),
      geminiHttpError(503),
    ]);

    const response = await POST(makeRequest({}));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(502);
  });

  it("returns 502 when the fetch call itself throws (network failure)", async () => {
    mockFetchSequence([new Error("network down")]);

    const response = await POST(makeRequest({}));

    expect(response.status).toBe(502);
  });
});

describe("POST /api/round/generate -- Roman Urdu (normal round generation)", () => {
  it("includes the Roman Urdu instruction block in the prompt", async () => {
    const fetchMock = mockFetchSequence([
      geminiOk({
        word: "Pizza",
        hint: "Kabhi doston ke sath khaya jata hai.",
      }),
    ]);

    await POST(makeRequest({ language: "roman-urdu" }));

    expect(promptFrom(fetchMock)).toContain("Language: Roman Urdu");
  });

  it("rejects a hint written in non-Latin script and retries", async () => {
    const fetchMock = mockFetchSequence([
      geminiOk({ word: "Pizza", hint: "پیزا ایک مشہور کھانا ہے" }),
      geminiOk({
        word: "Pizza",
        hint: "Kabhi doston ke sath khaya jata hai.",
      }),
    ]);

    const response = await POST(makeRequest({ language: "roman-urdu" }));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
  });

  it("rejects a hint that just reads as plain English and retries", async () => {
    const fetchMock = mockFetchSequence([
      geminiOk({
        word: "Sun",
        hint: "The star that is at the center of our solar system.",
      }),
      geminiOk({
        word: "Sun",
        hint: "Subha uthte hi sabse pehle yeh nazar aata hai.",
      }),
    ]);

    const response = await POST(makeRequest({ language: "roman-urdu" }));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
  });

  it("falls back to English when an unsupported language value is supplied", async () => {
    const fetchMock = mockFetchSequence([
      geminiOk({ word: "Kite", hint: "Flies on a string in the wind." }),
    ]);

    await POST(makeRequest({ language: "french" }));

    expect(promptFrom(fetchMock)).not.toContain("Language: Roman Urdu");
  });
});

describe("POST /api/round/generate -- Custom Words hint-only mode (additional coverage)", () => {
  it("retries once when the first hint attempt fails validation, returning the second attempt", async () => {
    const fetchMock = mockFetchSequence([
      geminiRawText("not json at all"),
      geminiOk({ hint: "Often shared during casual gatherings." }),
    ]);

    const response = await POST(
      makeRequest({ word: "Pizza", difficulty: "medium" }),
    );
    const data = await response.json();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
    expect(data.hint).toBe("Often shared during casual gatherings.");
  });

  it("returns 502 when the Gemini call throws inside the Custom Words branch", async () => {
    mockFetchSequence([new Error("network down")]);

    const response = await POST(
      makeRequest({ word: "Pizza", difficulty: "medium" }),
    );
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe("Hint generation failed.");
  });

  it("treats a non-object JSON response (e.g. a bare string) as a failed generation and retries", async () => {
    const fetchMock = mockFetchSequence([
      geminiRawText(JSON.stringify("just a string")),
      geminiOk({ hint: "A soft yellow fruit that is easy to peel." }),
    ]);

    const response = await POST(
      makeRequest({ word: "Banana", difficulty: "medium" }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
  });

  it("includes the supplied category as an angle for the hint when provided", async () => {
    const fetchMock = mockFetchSequence([
      geminiOk({ hint: "Enjoyed at celebrations." }),
    ]);

    await POST(
      makeRequest({ word: "Cake", category: "food", difficulty: "easy" }),
    );

    expect(promptFrom(fetchMock)).toContain('category is "food"');
  });

  it("omits the category line when no category is supplied for a Custom Word hint", async () => {
    const fetchMock = mockFetchSequence([
      geminiOk({ hint: "A sweet treat enjoyed on special occasions." }),
    ]);

    await POST(makeRequest({ word: "Candy", difficulty: "easy" }));

    expect(promptFrom(fetchMock)).not.toContain("category is");
  });

  it.each(["easy", "medium", "hard"] as const)(
    "applies hint-difficulty guidance for %s to the hint-only prompt too",
    async (difficulty) => {
      const fetchMock = mockFetchSequence([
        geminiOk({ hint: "A common household pet." }),
      ]);

      await POST(makeRequest({ word: "Cat", difficulty }));

      expect(promptFrom(fetchMock)).toContain(`Hint difficulty: ${difficulty}`);
    },
  );

  it("rejects a hint that reads as plain English under Roman Urdu, and retries", async () => {
    const fetchMock = mockFetchSequence([
      geminiOk({ hint: "The tasty dish that is popular and loved by many." }),
      geminiOk({ hint: "Sabko bohat pasand hoti hai." }),
    ]);

    const response = await POST(
      makeRequest({
        word: "Pizza",
        difficulty: "medium",
        language: "roman-urdu",
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
  });
});
