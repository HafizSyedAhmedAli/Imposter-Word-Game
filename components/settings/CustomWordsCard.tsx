import Link from "next/link";
import { ChevronRight, PenSquare } from "lucide-react";
import { playSound } from "@/lib/sound-engine";

export default function CustomWordsCard() {
  return (
    <section
      className="rounded-3xl border border-iw-border bg-iw-surface/40 p-4 backdrop-blur-sm animate-iw-fade-up sm:p-5"
      style={{ animationDelay: "45ms" }}
    >
      <h2 className="font-display text-lg font-semibold tracking-wide text-iw-ink-100 sm:text-xl">
        CUSTOM WORDS
      </h2>

      <Link
        href="/settings/custom-words"
        onClick={() => playSound("ui-tap")}
        className="mt-3 flex items-center gap-4 rounded-2xl border border-iw-border bg-iw-surface-2/60 px-4 py-3.5 transition-colors duration-150 hover:border-iw-border-strong hover:bg-iw-surface-2 active:scale-[0.99]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-iw-violet-500/15 text-iw-violet-300">
          <PenSquare
            className="h-5 w-5"
            strokeWidth={2.25}
            aria-hidden="true"
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-display text-base font-semibold tracking-wide text-iw-ink-100">
            MANAGE CUSTOM WORDS
          </span>
          <span className="text-sm text-iw-ink-500">
            Add your own words to use in games -- works offline
          </span>
        </span>
        <ChevronRight
          className="h-5 w-5 shrink-0 text-iw-ink-500"
          strokeWidth={2.25}
          aria-hidden="true"
        />
      </Link>
    </section>
  );
}
