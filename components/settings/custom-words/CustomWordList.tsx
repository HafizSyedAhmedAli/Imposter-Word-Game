"use client";

import { PenSquare } from "lucide-react";
import type { CustomWordEntry } from "@/lib/db";
import CustomWordCard from "./CustomWordCard";

export default function CustomWordList({
  words,
  onDelete,
}: {
  words: CustomWordEntry[];
  onDelete: (entry: CustomWordEntry) => void;
}) {
  if (words.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-iw-border px-4 py-8 text-center">
        <span
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-iw-surface-2 text-iw-ink-500"
          aria-hidden="true"
        >
          <PenSquare className="h-5 w-5" strokeWidth={2} />
        </span>
        <p className="mt-3 text-sm font-semibold text-iw-ink-300">
          No custom words yet
        </p>
        <p className="mt-1 text-xs text-iw-ink-500">
          Add your own words to make games more personal.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {words.map((entry) => (
        <CustomWordCard
          key={entry.id}
          entry={entry}
          onDelete={() => onDelete(entry)}
        />
      ))}
    </ul>
  );
}
