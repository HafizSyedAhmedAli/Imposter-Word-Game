import {
  ENGLISH,
  ROMAN_URDU,
  type Category,
  type Difficulty,
  type GameLanguage,
  type GeneratedRoundContent,
} from "@/game/game-types";
import {
  validateRomanUrduHint,
  validateRoundContent,
} from "@/game/round-validation";
import type { WordProvider } from "./word-provider";

const AI_TIMEOUT_MS = 10_000;

// On web, "/api/round/generate" is same-origin and this stays empty.
// In the Capacitor build there is no same-origin server to hit -- the
// request has to go out to wherever the real Next server (with the
// GEMINI_API_KEY) is actually deployed. See next.config.ts /
// scripts/build-mobile.mjs for how this gets set at build time.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * Calls the server-side round-generation route (app/api/round/generate)
 * so the AI provider's API key never touches the browser. This is the
 * ONLY place client code talks to that route -- the game engine never
 * calls fetch(...) directly.
 *
 * Any failure (timeout, network error, bad status, failed validation)
 * throws, and the caller (game/game-engine.ts) is responsible for
 * falling back to the local provider -- this class never falls back on
 * its own, so it stays a pure "try AI" implementation.
 */
export class AiWordProvider implements WordProvider {
  async generateRoundContent(
    category: Category,
    difficulty: Difficulty,
    options?: {
      signal?: AbortSignal;
      excludeWords?: string[];
      language?: GameLanguage;
    },
  ): Promise<GeneratedRoundContent> {
    const language = options?.language ?? ENGLISH;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    const onExternalAbort = () => controller.abort();
    options?.signal?.addEventListener("abort", onExternalAbort);

    try {
      const response = await fetch(`${API_BASE_URL}/api/round/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          difficulty,
          excludeWords: options?.excludeWords ?? [],
          language,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Round generation failed (${response.status}).`);
      }

      const data: unknown = await response.json();
      const candidate =
        typeof data === "object" && data !== null
          ? (data as { word?: unknown; hint?: unknown })
          : {};

      const validated = validateRoundContent(candidate);
      if (!validated.valid) {
        throw new Error(`AI content failed validation: ${validated.reason}`);
      }

      // Defense in depth, on top of the server-side check in
      // app/api/round/generate/route.ts: never let a hint containing
      // Urdu/Arabic/Devanagari script reach the game in Roman Urdu mode,
      // even if the server-side check were ever bypassed or out of sync.
      // Throwing here (rather than silently accepting it) lets the
      // caller (game/game-engine.ts) fall through to tier 2/3, matching
      // "never silently display Urdu/Arabic-script text in Roman Urdu
      // mode."
      if (language === ROMAN_URDU) {
        const scriptCheck = validateRomanUrduHint(validated.hint);
        if (!scriptCheck.valid) {
          throw new Error(
            `AI content failed validation: ${scriptCheck.reason}`,
          );
        }
      }

      return {
        word: validated.word,
        hint: validated.hint,
        source: "ai",
        language,
      };
    } finally {
      clearTimeout(timeout);
      options?.signal?.removeEventListener("abort", onExternalAbort);
    }
  }
}
