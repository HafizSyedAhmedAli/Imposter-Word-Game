"use client";

import { useEffect, useState } from "react";
import { Shuffle } from "lucide-react";
import type { Category } from "@/game/game-types";
import {
  CATEGORIES,
  CUSTOM_CATEGORY,
  CUSTOM_WORD_CATEGORIES,
  MORE_CATEGORIES,
} from "@/features/play-round";
import { getCustomWords } from "@/lib/db";
import AppLink from "@/components/pwa/AppLink";
import CategoryCard from "./CategoryCard";
import MoreCategoriesSheet from "./MoreCategoriesSheet";

export default function CategorySelector({
  category,
  customWordCategory,
  onChange,
  onSelectCustomWordCategory,
}: {
  category: Category;
  customWordCategory?: Category;
  onChange: (category: Category) => void;
  onSelectCustomWordCategory: (category: Category) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isRandom = category === "random";
  const isCustomMode = category === CUSTOM_CATEGORY;

  // "More" is highlighted when the active category was picked from the sheet.
  const isFromMoreSheet = MORE_CATEGORIES.some((c) => c.id === category);

  // Which of the player's saved custom-word categories actually have at
  // least one word saved -- read fresh from IndexedDB (lib/db.ts) on
  // every mount of this screen, since Settings -> Custom Words can add
  // or delete words between visits here. `null` while that first read
  // is in flight, distinct from `[]` (confirmed empty), so the toggle
  // never flashes the "add a word" message before it actually knows.
  const [availableCategories, setAvailableCategories] = useState<
    { id: Category; label: string }[] | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    getCustomWords()
      .then((words) => {
        if (cancelled) return;
        const present = new Set(words.map((w) => w.category));
        setAvailableCategories(
          CUSTOM_WORD_CATEGORIES.filter((c) => present.has(c.id)),
        );
      })
      .catch(() => {
        if (!cancelled) setAvailableCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleToggleCustomWords() {
    if (isCustomMode) {
      // Leaving Custom Words mode -- Random is the same safe default
      // the shortcut button above already offers.
      onChange("random");
      return;
    }
    if (availableCategories && availableCategories.length > 0) {
      onSelectCustomWordCategory(availableCategories[0].id);
    } else {
      // No saved custom words yet: still flip into Custom Words mode so
      // the empty-state message below renders, but with no specific
      // category selected. If the player continues anyway with no
      // words saved, getRandomCustomWord (lib/db.ts) finds none and
      // game-engine.ts falls through to the normal 3-tier pipeline --
      // never an unplayable round.
      onChange(CUSTOM_CATEGORY);
    }
  }

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

      <button
        type="button"
        role="switch"
        aria-checked={isCustomMode}
        aria-label={`Custom Words, ${isCustomMode ? "on" : "off"}`}
        onClick={handleToggleCustomWords}
        className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-iw-border bg-iw-surface/60 px-4 py-3 text-left transition-colors duration-150 hover:border-iw-border-strong cursor-pointer"
      >
        <span>
          <span className="block text-sm font-semibold text-iw-ink-100">
            Custom Words
          </span>
          <span className="block text-xs text-iw-ink-500">
            Play only with words you&apos;ve saved
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-150 ${
            isCustomMode
              ? "border-iw-violet-400/60 bg-iw-violet-500"
              : "border-iw-border bg-iw-surface-2"
          }`}
        >
          <span
            className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-md transition-transform duration-150 ${
              isCustomMode ? "translate-x-[22px]" : "translate-x-1"
            }`}
          />
        </span>
      </button>

      {isCustomMode ? (
        availableCategories === null ? (
          <p className="mt-4 text-sm text-iw-ink-500">
            Checking your saved custom words&hellip;
          </p>
        ) : availableCategories.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-iw-border bg-iw-surface/60 px-4 py-3.5 text-sm text-iw-ink-300">
            You haven&apos;t saved any custom words yet. Add a custom word from
            the Settings screen.
            <AppLink
              href="/settings/custom-words"
              className="mt-2 block text-sm font-semibold text-iw-violet-300 hover:text-iw-violet-200"
            >
              Go to Custom Words settings &rarr;
            </AppLink>
          </div>
        ) : (
          <div
            role="radiogroup"
            aria-label="Custom word category"
            className="-mx-4 mt-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
          >
            {availableCategories.map((c) => (
              <CategoryCard
                key={c.id}
                id={c.id}
                label={c.label}
                selected={customWordCategory === c.id}
                onSelect={() => onSelectCustomWordCategory(c.id)}
              />
            ))}
          </div>
        )
      ) : (
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
      )}

      <MoreCategoriesSheet
        open={moreOpen}
        selected={category}
        onSelect={onChange}
        onClose={() => setMoreOpen(false)}
      />
    </section>
  );
}
