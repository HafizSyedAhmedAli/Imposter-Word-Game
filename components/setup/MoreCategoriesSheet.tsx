"use client";

import { useEffect, useRef } from "react";
import { X, Check } from "lucide-react";
import type { Category } from "@/game/game-types";
import { MORE_CATEGORIES } from "@/game/game-rules";

export default function MoreCategoriesSheet({
  open,
  selected,
  onSelect,
  onClose,
}: {
  open: boolean;
  selected: Category;
  onSelect: (category: Category) => void;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close more categories"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-iw-fade-in"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="More categories"
        className="relative z-10 w-full max-w-md rounded-t-3xl border border-iw-border bg-iw-nebula-2 p-5 pb-safe shadow-[0_-16px_40px_-16px_rgba(0,0,0,0.6)] animate-iw-fade-up sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-iw-ink-100">
            More Categories
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-iw-border bg-iw-surface/70 text-iw-ink-100 transition-colors hover:border-iw-border-strong hover:bg-iw-surface-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {MORE_CATEGORIES.map((c) => {
            const isSelected = selected === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  onSelect(c.id);
                  onClose();
                }}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-left text-sm font-semibold transition-colors ${
                  isSelected
                    ? "border-iw-violet-400 bg-iw-violet-500/15 text-iw-ink-100"
                    : "border-iw-border bg-iw-surface/60 text-iw-ink-300 hover:border-iw-border-strong"
                }`}
              >
                {c.label}
                {isSelected && (
                  <Check
                    className="h-4 w-4 shrink-0 text-iw-violet-300"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
