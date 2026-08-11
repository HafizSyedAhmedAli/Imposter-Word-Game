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

function buildPrompt(category: Category, difficulty: Difficulty): string {
  return `Generate exactly one secret word and one hint for a social party game called "Imposter Word", where most players know a secret word and one "imposter" does not.

Category: ${category === "random" ? "any family-friendly category" : category}
Difficulty: ${difficulty}

Rules:
- The word must be a single concept or short recognizable term (at most 3 words).
- The word must be appropriate for all ages -- never offensive, violent, or explicit.
- ${DIFFICULTY_GUIDANCE[difficulty]}
- The hint must relate to the word but must NEVER contain the word itself (or an obvious variant of it).
- Do not use real people, brands, or copyrighted characters as the word.

Respond with ONLY a JSON object in this exact shape:
{"word": "...", "hint": "..."}`;
}

/**
 * POST { category, difficulty } -> { word, hint }
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

  let body: { category?: Category; difficulty?: Difficulty };
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

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    const aiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildPrompt(category, difficulty) }],
          },
        ],
        generationConfig: {
          // Forces the model to output clean JSON without markdown blocks
          responseMimeType: "application/json",
        },
      }),
    });

    if (!aiResponse.ok) {
      return NextResponse.json(
        { error: "Round generation failed." },
        { status: 502 },
      );
    }

    const data = await aiResponse.json();

    // Extract the text content from the Gemini response structure
    const rawText: string =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "Round generation failed." },
        { status: 502 },
      );
    }

    const candidate =
      typeof parsed === "object" && parsed !== null
        ? (parsed as { word?: unknown; hint?: unknown })
        : {};

    const validated = validateRoundContent(candidate);
    if (!validated.valid) {
      return NextResponse.json(
        { error: "Round generation failed." },
        { status: 502 },
      );
    }

    return NextResponse.json({ word: validated.word, hint: validated.hint });
  } catch {
    return NextResponse.json(
      { error: "Round generation failed." },
      { status: 502 },
    );
  }
}
