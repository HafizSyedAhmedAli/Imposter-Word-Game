import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import ConnectionStatus from "@/components/home/ConnectionStatus";

export default function PlayersHeader() {
  return (
    <header className="flex items-start justify-between gap-3">
      <Link
        href="/setup"
        aria-label="Go back"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-iw-border bg-iw-surface/60 text-iw-ink-100 backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-iw-border-strong hover:bg-iw-surface-2 active:translate-y-0 active:scale-95"
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
      </Link>

      <div className="flex flex-1 flex-col items-center px-1 text-center">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full bg-iw-violet-500/20 text-iw-violet-300 sm:h-9 sm:w-9"
          aria-hidden="true"
        >
          <Users className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
        </span>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-iw-ink-100 sm:text-4xl">
          WHO&apos;S PLAYING?
        </h1>
        <p className="mt-1 max-w-[22rem] text-sm text-iw-violet-300 sm:text-base">
          Add everyone joining the game
        </p>
      </div>

      <div className="shrink-0">
        <ConnectionStatus />
      </div>
    </header>
  );
}
