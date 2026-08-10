"use client";

import { useState } from "react";
import { Shuffle } from "lucide-react";
import type { Category } from "@/game/game-types";
import { CATEGORIES, MORE_CATEGORIES } from "@/game/game-rules";
import CategoryCard from "./CategoryCard";
import MoreCategoriesSheet from "./MoreCategoriesSheet";

export default function CategorySelector({
  category,
  onChange,
}: {
  category: Category;
  onChange: (category: Category) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isRandom = category === "random";

  // "More" is highlighted when the active category was picked from the sheet.
  const isFromMoreSheet = MORE_CATEGORIES.some((c) => c.id === category);

  return (
    <section
      className="rounded-3xl border border-iw-border bg-iw-surface/40 p-4 backdrop-blur-sm animate-iw-fade-up sm:p-5"
      style={{ animationDelay: "80ms" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-wide text-iw-ink-100 sm:text-xl">
            2. CHOOSE CATEGORY
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onChange("random")}
          aria-pressed={isRandom}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${
            isRandom
              ? "text-iw-violet-300"
              : "text-iw-ink-500 hover:text-iw-violet-300"
          }`}
        >
          <Shuffle className="h-4 w-4" aria-hidden="true" />
          Random
        </button>
      </div>

      <div
        role="radiogroup"
        aria-label="Word category"
        className="-mx-4 mt-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        {CATEGORIES.map((c) =>
          c.id === "more" ? (
            <CategoryCard
              key="more"
              id="more"
              label="More"
              selected={isFromMoreSheet}
              onSelect={() => setMoreOpen(true)}
            />
          ) : (
            <CategoryCard
              key={c.id}
              id={c.id}
              label={c.label}
              selected={category === c.id}
              onSelect={() => onChange(c.id)}
            />
          ),
        )}
      </div>

      <MoreCategoriesSheet
        open={moreOpen}
        selected={category}
        onSelect={onChange}
        onClose={() => setMoreOpen(false)}
      />
    </section>
  );
}
