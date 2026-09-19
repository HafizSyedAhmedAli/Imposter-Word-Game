import { describe, it, expect, beforeEach } from "vitest";
import {
  rateLimit,
  getClientIp,
  __resetRateLimitForTests,
} from "@/shared/lib/rate-limit";

/**
 * shared/lib/rate-limit.ts had zero direct test coverage before this file.
 * Its module-level `buckets` Map is intentionally process-lifetime state
 * (see the file's doc comment), which is exactly what let it leak across
 * unrelated tests in test/api/round-generate.test.ts and
 * round-generate-hint.test.ts -- 20+ POST calls across a test file shared
 * one bucket (no x-forwarded-for header on Request objects built by
 * `new Request(...)` in tests, so every call fell back to the "unknown"
 * key), and once a run crossed the route's real 20-req/60s limit,
 * later tests in the same file started getting silently rate-limited
 * (429) instead of exercising the behavior they meant to test. Every
 * test here resets the buckets first so each one starts from a clean
 * window, and both API test files now do the same via
 * __resetRateLimitForTests in their own beforeEach.
 */

beforeEach(() => {
  __resetRateLimitForTests();
});

describe("rateLimit", () => {
  it("allows requests up to the limit within the window", () => {
    for (let i = 0; i < 5; i++) {
      expect(rateLimit("key-a", 5, 60_000).allowed).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit, with a retryAfterSeconds", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit("key-b", 5, 60_000);
    }
    const result = rateLimit("key-b", 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks separate keys independently", () => {
    for (let i = 0; i < 5; i++) rateLimit("key-c", 5, 60_000);
    // A different key has its own bucket -- exhausting "key-c" above
    // must not affect "key-d".
    expect(rateLimit("key-d", 5, 60_000).allowed).toBe(true);
  });

  it("resets to a fresh window after __resetRateLimitForTests", () => {
    for (let i = 0; i < 5; i++) rateLimit("key-e", 5, 60_000);
    expect(rateLimit("key-e", 5, 60_000).allowed).toBe(false);

    __resetRateLimitForTests();

    expect(rateLimit("key-e", 5, 60_000).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  function requestWithHeaders(headers: Record<string, string>): Request {
    return new Request("http://localhost/api/round/generate", { headers });
  }

  it("uses the first entry of x-forwarded-for when present", () => {
    const ip = getClientIp(
      requestWithHeaders({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }),
    );
    expect(ip).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const ip = getClientIp(requestWithHeaders({ "x-real-ip": "9.9.9.9" }));
    expect(ip).toBe("9.9.9.9");
  });

  it('falls back to "unknown" when neither header is present', () => {
    const ip = getClientIp(requestWithHeaders({}));
    expect(ip).toBe("unknown");
  });
});
