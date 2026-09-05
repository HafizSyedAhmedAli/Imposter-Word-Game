import { NextResponse } from "next/server";
import {
  ENGLISH,
  ROMAN_URDU,
  isGameLanguage,
  type Category,
  type Difficulty,
  type GameLanguage,
} from "@/game/game-types";
import {
  validateRomanUrduHint,
  validateRoundContent,
} from "@/game/round-validation";

// Node runtime (not edge) -- keeps this close to a normal server
// environment for the outbound fetch to the AI provider.
export const runtime = "nodejs";

const DIFFICULTY_GUIDANCE: Record<Difficulty, string> = {
  easy: "Use a common, instantly recognizable word. The hint should be clear and directly helpful.",
  medium:
    "Use a moderately recognizable word. The hint should be indirect but still understandable.",
  hard: "Use a less obvious, more specific concept. The hint should be subtle, without being unfair.",
};

// Add near the top, after the existing DIFFICULTY_GUIDANCE etc.:

// The Capacitor build calls this route cross-origin (from
// capacitor://localhost or https://localhost, not this route's own
// domain -- see providers/ai-word-provider.ts). The response never
// contains anything secret or user-specific (just { word, hint }), so
// a wildcard origin is safe here, unlike an endpoint that reads
// cookies or returns per-user data.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// Roman Urdu-specific prompt addendum (spec section 7). Only the HINT
// is meant to be Roman Urdu -- the word itself should generally stay a
// common English term, since that's what's natural for a Pakistani/
// Roman-Urdu-speaking player (spec section 5). Kept as a separate block
// appended to the shared prompt, rather than a second prompt template,
// so the two languages never drift on the actual game rules above.
const ROMAN_URDU_INSTRUCTIONS = `
Language: Roman Urdu

You are generating a word-game hint for Pakistani players.
- The word itself should usually stay a common, everyday English word (e.g. Pizza, Football, Umbrella, Laptop) -- do not translate the word into Urdu.
- Generate the hint in natural Roman Urdu using ONLY Latin/English letters.
- Do NOT use Urdu, Arabic, or Devanagari script anywhere in the hint.
- Keep the wording simple, conversational, and easy to understand -- not overly formal.
- Do not translate an English hint mechanically. Think about the word first and write the hint naturally in Roman Urdu, the way a Pakistani player would actually say it out loud.
- The hint should help players identify the concept without directly saying the word.`;

function buildPrompt(
  category: Category,
  difficulty: Difficulty,
  excludeWords: string[],
  language: GameLanguage,
): string {
  const exclusionRule =
    excludeWords.length > 0
      ? `\n- Do not use any of these words -- they were used in recent rounds and must be avoided: ${excludeWords.join(
          ", ",
        )}.`
      : "";

  const languageBlock =
    language === ROMAN_URDU ? `\n${ROMAN_URDU_INSTRUCTIONS}\n` : "";

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
${languageBlock}
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
  language: GameLanguage,
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
          parts: [
            { text: buildPrompt(category, difficulty, excludeWords, language) },
          ],
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

  // Roman Urdu hints must be Latin-script only -- a model that ignores
  // the prompt instruction and slips into Urdu/Arabic script is treated
  // as a failed generation here (the caller's retry loop below gets one
  // more attempt at it), never returned to the client as-is.
  if (language === ROMAN_URDU) {
    const scriptCheck = validateRomanUrduHint(validated.hint);
    if (!scriptCheck.valid) return null;
  }

  return { word: validated.word, hint: validated.hint };
}

/**
 * POST { category, difficulty, excludeWords, language } -> { word, hint }
 *
 * This route is the ONLY place the AI provider's API key is ever read.
 * It never forwards the raw AI response to the client -- only a
 * validated { word, hint } pair, or a generic error. The client-side
 * AiWordProvider (providers/ai-word-provider.ts) treats ANY non-2xx
 * response as a signal to fall back to the local word collection, so
 * failures here are never fatal to the game.
 */
// app/api/round/generate/route.ts (only the POST handler's retry loop changed)
export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI provider not configured." },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  let body: {
    category?: Category;
    difficulty?: Difficulty;
    excludeWords?: unknown;
    language?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const category = body.category ?? "random";
  const difficulty = body.difficulty ?? "medium";
  const language: GameLanguage = isGameLanguage(body.language)
    ? body.language
    : ENGLISH;
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
    // Up to two attempts: if the model ignores the exclusion list, or
    // returns Roman Urdu content that fails validation (non-Latin
    // script, or -- the reported bug -- a hint that just reads as
    // plain English), retry once with the same inputs before giving up
    // and falling through to tier 2/3. This is a best-effort second
    // line of defense on top of the prompt-level instructions above --
    // never a loop that can hang the request indefinitely.
    let result: { word: string; hint: string } | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const attemptResult = await requestRoundContent(
        apiKey,
        category,
        difficulty,
        excludeWords,
        language,
      );
      // A null result means requestRoundContent's own validation (JSON
      // shape, or the Roman Urdu script/English-detection checks)
      // rejected the model's output -- that's exactly the case that
      // deserves the one extra attempt described above, so `continue`
      // rather than bailing out on the first bad response. `result`
      // only gets overwritten on a real response, so a failed final
      // attempt still falls through to tier 2/3 with `result` left null.
      if (!attemptResult) continue;
      result = attemptResult;
      if (!excludeSet.has(attemptResult.word.toLowerCase())) break; // got a fresh word
    }

    if (!result) {
      return NextResponse.json(
        { error: "Round generation failed." },
        { status: 502, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      { word: result.word, hint: result.hint },
      { headers: CORS_HEADERS },
    );
  } catch {
    return NextResponse.json(
      { error: "Round generation failed." },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}
