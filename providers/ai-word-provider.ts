import type {
  Category,
  Difficulty,
  GeneratedRoundContent,
} from "@/game/game-types";
import { validateRoundContent } from "@/game/round-validation";
import type { WordProvider } from "./word-provider";

const AI_TIMEOUT_MS = 10_000;

/**
 * Calls the server-side round-generation route (app/api/round/generate)
 * so the AI provider's API key never touches the browser. This is the
 * ONLY place client code talks to that route -- the game engine never
 * calls fetch("/api/round/generate") directly.
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
    options?: { signal?: AbortSignal },
  ): Promise<GeneratedRoundContent> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    // Let an external (caller-provided) signal abort this request too,
    // e.g. when the player presses Back mid-generation (see
    // components/round/RoundPreparationScreen.tsx).
    const onExternalAbort = () => controller.abort();
    options?.signal?.addEventListener("abort", onExternalAbort);

    try {
      const response = await fetch("/api/round/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, difficulty }),
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

      return { word: validated.word, hint: validated.hint, source: "ai" };
    } finally {
      clearTimeout(timeout);
      options?.signal?.removeEventListener("abort", onExternalAbort);
    }
  }
}