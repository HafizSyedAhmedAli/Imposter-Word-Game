import { NextResponse } from "next/server";
import type { Category, Difficulty } from "@/game/game-types";
import { validateRoundContent } from "@/game/round-validation";

// Node runtime (not edge) -- keeps this close to a normal server
// environment for the outbound fetch to the AI provider.
export const runtime = "nodejs";

const DIFFICULTY_GUIDANCE: Record<Difficulty, string> = {
  easy: "Use a common, instantly recognizable word. The hint should be clear and directly helpful.",
  medium:
    "Use a moderately recognizable word. The hint should be indirect but still understandable.",
  hard: "Use a less obvious, more specific concept. The hint should be subtle, without being unfair.",
};

function buildPrompt(
  category: Category,
  difficulty: Difficulty,
  excludeWords: string[],
): string {
  const exclusionRule =
    excludeWords.length > 0
      ? `\n- Do not use any of these words -- they were used in recent rounds and must be avoided: ${excludeWords.join(", ")}.`
      : "";

  return `Generate exactly one secret word and one hint for a social party game called "Imposter Word", where most players know a secret word and one "imposter" does not.

Category: ${category === "random" ? "any family-friendly category" : category}
Difficulty: ${difficulty}

Rules:
- The word must be a single concept or short recognizable term (at most 3 words).
- The word must be appropriate for all ages -- never offensive, violent, or explicit.
- ${DIFFICULTY_GUIDANCE[difficulty]}
- The hint must relate to the word but must NEVER contain the word itself (or an obvious variant of it).
- Do not use real people, brands, or copyrighted characters as the word.
- Vary your answer -- avoid defaulting to the single most obvious or stereotypical example for this category every time.${exclusionRule}

Respond with ONLY a JSON object in this exact shape:
{"word": "...", "hint": "..."}`;
}

/**
 * One call to the Gemini API: build the prompt, extract and validate the
 * { word, hint } pair. Split out from POST so it can be retried below
 * without duplicating the fetch/parse/validate logic.
 */
async function requestRoundContent(
  apiKey: string,
  category: Category,
  difficulty: Difficulty,
  excludeWords: string[],
): Promise<{ word: string; hint: string } | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

  const aiResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: buildPrompt(category, difficulty, excludeWords) }],
        },
      ],
      generationConfig: {
        // Forces the model to output clean JSON without markdown blocks
        responseMimeType: "application/json",
        // Explicit (rather than relying on the API default) -- a low or
        // unset temperature is exactly what let the model collapse onto
        // the single highest-probability word for a given
        // category/difficulty every time (e.g. "pizza" for every
        // food/easy request). This alone doesn't guarantee variety --
        // see the exclusion list above and the retry below -- but it
        // widens the pool the model draws from.
        temperature: 1.2,
      },
    }),
  });

  if (!aiResponse.ok) return null;

  const data = await aiResponse.json();
  const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return null;
  }

  const candidate =
    typeof parsed === "object" && parsed !== null
      ? (parsed as { word?: unknown; hint?: unknown })
      : {};

  const validated = validateRoundContent(candidate);
  if (!validated.valid) return null;

  return { word: validated.word, hint: validated.hint };
}

/**
 * POST { category, difficulty, excludeWords } -> { word, hint }
 *
 * This route is the ONLY place the AI provider's API key is ever read.
 * It never forwards the raw AI response to the client -- only a
 * validated { word, hint } pair, or a generic error. The client-side
 * AiWordProvider (providers/ai-word-provider.ts) treats ANY non-2xx
 * response as a signal to fall back to the local word collection, so
 * failures here are never fatal to the game.
 */
export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Misconfiguration, not a player-facing error -- the client falls
    // back to the local word collection either way.
    return NextResponse.json(
      { error: "AI provider not configured." },
      { status: 503 },
    );
  }

  let body: {
    category?: Category;
    difficulty?: Difficulty;
    excludeWords?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const category = body.category ?? "random";
  const difficulty = body.difficulty ?? "medium";
  const MAX_EXCLUDED_WORDS = 8;
  const MAX_EXCLUDED_WORD_LENGTH = 100;
  const excludeWords = Array.isArray(body.excludeWords)
    ? [
        ...new Set(
          body.excludeWords
            .filter((word): word is string => typeof word === "string")
            .map((word) => word.trim().toLowerCase())
            .filter(
              (word) =>
                word.length > 0 && word.length <= MAX_EXCLUDED_WORD_LENGTH,
            ),
        ),
      ].slice(0, MAX_EXCLUDED_WORDS)
    : [];
  const excludeSet = new Set(excludeWords);

  try {
    // Up to two attempts: if the model ignores the exclusion list on
    // the first try (it's a prompt instruction, not an enforced
    // constraint), retry once with the same exclusion list before
    // giving up and accepting whatever came back. This is a
    // best-effort second line of defense on top of the prompt-level
    // exclusion and temperature above -- never a loop that can hang the
    // request indefinitely.
    let result: { word: string; hint: string } | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      result = await requestRoundContent(
        apiKey,
        category,
        difficulty,
        excludeWords,
      );
      if (!result) break; // a real failure -- fall through to tier 2/3, don't retry a broken response
      if (!excludeSet.has(result.word.toLowerCase())) break; // got a fresh word
    }

    if (!result) {
      return NextResponse.json(
        { error: "Round generation failed." },
        { status: 502 },
      );
    }

    return NextResponse.json({ word: result.word, hint: result.hint });
  } catch {
    return NextResponse.json(
      { error: "Round generation failed." },
      { status: 502 },
    );
  }
}
