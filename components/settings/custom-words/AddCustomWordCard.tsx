"use client";

import { useRef, useState } from "react";
import { Plus, Type } from "lucide-react";
import type { Category, Difficulty } from "@/game/game-types";
import { CUSTOM_WORD_CATEGORIES } from "@/game/game-rules";
import { MAX_CUSTOM_WORD_LENGTH } from "@/game/custom-word-rules";
import DifficultySelector from "@/components/setup/DifficultySelector";
import { playSound } from "@/lib/sound-engine";

export type AddCustomWordOutcome = { ok: true } | { ok: false; error: string };

const DEFAULT_CATEGORY: Category = CUSTOM_WORD_CATEGORIES[0]?.id ?? "food";

/**
 * The "Add Custom Word" form (spec: Word / Category / Difficulty /
 * [Save Word]). Reuses existing building blocks rather than inventing
 * new ones: `DifficultySelector` is the exact same component the Setup
 * screen uses (it has no dependency on the setup flow itself), the
 * category picker mirrors `MoreCategoriesSheet`'s pill-button styling,
 * and the text input mirrors `PlayerInput`'s bordered-row pattern.
 */
export default function AddCustomWordCard({
  onAdd,
}: {
  onAdd: (input: {
    word: string;
    category: Category;
    difficulty: Difficulty;
  }) => Promise<AddCustomWordOutcome>;
}) {
  const [word, setWord] = useState("");
  const [category, setCategory] = useState<Category>(DEFAULT_CATEGORY);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (saving) return;
    playSound("ui-tap");
    setSaving(true);
    const result = await onAdd({ word, category, difficulty });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setWord("");
    inputRef.current?.focus();
  }

  return (
    <section
      className="rounded-3xl border border-iw-border bg-iw-surface/40 p-4 backdrop-blur-sm animate-iw-fade-up sm:p-5"
      style={{ animationDelay: "40ms" }}
    >
      <h2 className="font-display text-lg font-semibold tracking-wide text-iw-ink-100 sm:text-xl">
        ADD CUSTOM WORD
      </h2>
      <p className="mt-1 text-sm text-iw-ink-500">
        Saved on this device -- works offline.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <div>
          <label htmlFor="custom-word-input" className="sr-only">
            Word
          </label>
          <div
            className={`flex items-center gap-2 rounded-2xl border bg-iw-surface/60 px-4 py-3 transition-colors ${
              error
                ? "border-iw-red"
                : "border-iw-border focus-within:border-iw-violet-400"
            }`}
          >
            <Type
              className="h-4 w-4 shrink-0 text-iw-ink-500"
              aria-hidden="true"
            />
            <input
              id="custom-word-input"
              ref={inputRef}
              type="text"
              value={word}
              maxLength={MAX_CUSTOM_WORD_LENGTH + 10}
              placeholder="e.g. Biryani"
              disabled={saving}
              onChange={(e) => {
                setWord(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              className="w-full bg-transparent text-sm text-iw-ink-100 placeholder:text-iw-ink-600 focus:outline-none disabled:cursor-not-allowed"
            />
          </div>
          {error && (
            <p
              role="alert"
              className="mt-1.5 text-xs font-semibold text-iw-red"
            >
              {error}
            </p>
          )}
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
            Category
          </span>
          <div
            role="radiogroup"
            aria-label="Custom word category"
            className="mt-2 flex flex-wrap gap-2"
          >
            {CUSTOM_WORD_CATEGORIES.map((c) => {
              const selected = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={saving}
                  onClick={() => setCategory(c.id)}
                  className={`cursor-pointer rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    selected
                      ? "border-iw-violet-400 bg-iw-violet-500/15 text-iw-ink-100"
                      : "border-iw-border bg-iw-surface/60 text-iw-ink-300 hover:border-iw-border-strong"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
            Difficulty
          </span>
          <div className="mt-2">
            <DifficultySelector
              difficulty={difficulty}
              onChange={setDifficulty}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-iw-violet-400/40 bg-iw-violet-500/15 px-4 py-3 text-sm font-semibold text-iw-violet-300 transition-all duration-150 hover:-translate-y-0.5 hover:bg-iw-violet-500/25 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          {saving ? "Saving..." : "Save Word"}
        </button>
      </div>
    </section>
  );
}
