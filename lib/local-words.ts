import type { Category, Difficulty } from "@/game/game-types";
import { ensureSeeded, getDb } from "./db";

const RECENT_WORDS_KEY = "iw:recent-word-ids";
const RECENT_WORDS_LIMIT = 10;

function getRecentWordIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(RECENT_WORDS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function rememberWordId(id: string) {
  if (typeof window === "undefined") return;
  try {
    const recent = [
      id,
      ...getRecentWordIds().filter((existing) => existing !== id),
    ].slice(0, RECENT_WORDS_LIMIT);
    sessionStorage.setItem(RECENT_WORDS_KEY, JSON.stringify(recent));
  } catch {
    // Best-effort only -- duplicate protection is a nice-to-have, never
    // something that should block a round from starting.
  }
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Picks a random word/hint pair from the offline collection, matching
 * category + difficulty as closely as possible. Falls back in stages so
 * the game is NEVER blocked by a narrow local collection:
 *
 *   1. Exact category + difficulty, excluding recently used words
 *   2. Exact category + difficulty (recent words allowed)
 *   3. Exact category, any difficulty
 *   4. Any category, exact difficulty
 *   5. Any word in the collection
 *
 * Throws only if the local collection is completely empty/unreachable --
 * the caller (game engine) treats that as "local database failed" (see
 * game/game-engine.ts).
 */
export async function getRandomLocalWord(
  category: Category,
  difficulty: Difficulty,
) {
  await ensureSeeded();
  const db = getDb();
  const all = await db.words.toArray();
  if (all.length === 0) {
    throw new Error("Local word collection is empty.");
  }

  const recentIds = new Set(getRecentWordIds());
  const isRandomCategory = category === "random";

  const byCategoryAndDifficulty = all.filter(
    (w) =>
      (isRandomCategory || w.category === category) &&
      w.difficulty === difficulty,
  );
  const byCategory = all.filter(
    (w) => isRandomCategory || w.category === category,
  );
  const byDifficulty = all.filter((w) => w.difficulty === difficulty);

  const pools = [
    byCategoryAndDifficulty.filter((w) => !recentIds.has(w.id)),
    byCategoryAndDifficulty,
    byCategory,
    byDifficulty,
    all,
  ];

  const pool = pools.find((p) => p.length > 0) ?? all;
  const entry = pickRandom(pool);
  rememberWordId(entry.id);

  return { word: entry.word, hint: entry.hint, source: "local" as const };
}
