"use client";

import { Trash2 } from "lucide-react";
import type { CustomWordEntry } from "@/lib/db";
import { CUSTOM_WORD_CATEGORIES, DIFFICULTIES } from "@/game/game-rules";

function categoryLabel(id: string): string {
  return CUSTOM_WORD_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

function difficultyLabel(id: string): string {
  return DIFFICULTIES.find((d) => d.id === id)?.title ?? id;
}

export default function CustomWordCard({
  entry,
  onDelete,
}: {
  entry: CustomWordEntry;
  onDelete: () => void;
}) {
  return (
    <li className="flex animate-iw-fade-in items-center gap-3 rounded-2xl border border-iw-border bg-iw-surface/60 px-4 py-3 transition-colors hover:border-iw-border-strong">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-display text-base font-semibold tracking-wide text-iw-ink-100">
          {entry.word}
        </span>
        <span className="truncate text-sm text-iw-ink-500">
          {categoryLabel(entry.category)}
          {" \u00b7 "}
          {difficultyLabel(entry.difficulty)}
        </span>
      </span>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${entry.word}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-iw-red/30 bg-iw-red/10 text-iw-red transition-all duration-150 hover:-translate-y-0.5 hover:bg-iw-red/20 active:translate-y-0 active:scale-95 cursor-pointer"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  );
}
