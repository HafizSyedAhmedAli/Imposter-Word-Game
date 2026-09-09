"use client";

import { useEffect, useState } from "react";
import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import CustomWordsHeader from "./CustomWordsHeader";
import AddCustomWordCard, {
  type AddCustomWordOutcome,
} from "./AddCustomWordCard";
import CustomWordList from "./CustomWordList";
import DeleteCustomWordDialog from "./DeleteCustomWordDialog";
import {
  addCustomWord,
  deleteCustomWord,
  getCustomWords,
  type CustomWordEntry,
} from "@/lib/db";
import type { Category, Difficulty } from "@/game/game-types";
import { success, warning } from "@/lib/haptics";
import { playSound } from "@/lib/sound-engine";
import { captureError } from "@/lib/monitoring";

export default function CustomWordsScreen() {
  // `null` = still loading; `[]` = loaded, genuinely empty.
  const [words, setWords] = useState<CustomWordEntry[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomWordEntry | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    getCustomWords()
      .then((rows) => {
        if (!cancelled) setWords(rows);
      })
      .catch((error) => {
        captureError(error, { phase: "load-custom-words" });
        if (!cancelled) setWords([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdd(input: {
    word: string;
    category: Category;
    difficulty: Difficulty;
  }): Promise<AddCustomWordOutcome> {
    const result = await addCustomWord(input);
    if (!result.ok) {
      playSound("ui-error");
      return { ok: false, error: result.error };
    }
    success();
    playSound("ui-confirm");
    // Newest-first, matching getCustomWords' own ordering.
    setWords((prev) => [result.entry, ...(prev ?? [])]);
    return { ok: true };
  }

  function handleRequestDelete(entry: CustomWordEntry) {
    playSound("ui-tap");
    setDeleteTarget(entry);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    warning();
    setDeleteTarget(null);
    // Optimistic removal -- this only ever affects future word
    // selection (lib/db.ts's getRandomCustomWord), never a round already
    // in progress, so there's nothing to reconcile if it fails.
    setWords((prev) => (prev ?? []).filter((w) => w.id !== id));
    try {
      await deleteCustomWord(id);
    } catch (error) {
      captureError(error, { phase: "delete-custom-word" });
    }
  }

  return (
    <div className="relative flex min-h-dvh w-full justify-center">
      <SpaceBackdrop />

      <div className="flex w-full max-w-[1400px] flex-col px-4 pl-safe pr-safe pt-safe pb-safe sm:px-6 sm:py-8 lg:px-10">
        <CustomWordsHeader />

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 py-6">
          <AddCustomWordCard onAdd={handleAdd} />

          <section
            className="animate-iw-fade-up"
            style={{ animationDelay: "80ms" }}
          >
            <h2 className="mb-2 px-1 font-display text-lg font-semibold tracking-wide text-iw-ink-100 sm:text-xl">
              YOUR CUSTOM WORDS
            </h2>
            {words === null ? (
              <div
                className="h-24 animate-pulse rounded-2xl border border-iw-border bg-iw-surface/40"
                aria-hidden="true"
              />
            ) : (
              <CustomWordList words={words} onDelete={handleRequestDelete} />
            )}
          </section>
        </main>
      </div>

      {deleteTarget && (
        <DeleteCustomWordDialog
          word={deleteTarget.word}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
