import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ConnectionStatus from "@/components/home/ConnectionStatus";

function SetupPlanetIcon() {
  return (
    <div
      className="relative mx-auto h-7 w-7 shrink-0 sm:h-8 sm:w-8"
      aria-hidden="true"
    >
      <div
        className="h-full w-full rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #cbb4ff, #7a52e8 55%, #3c2280 100%)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-2.5 w-full -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] rounded-full border border-white/30"
        aria-hidden="true"
      />
    </div>
  );
}

export default function SetupHeader() {
  return (
    <header className="flex items-start justify-between gap-3">
      <Link
        href="/"
        aria-label="Go back"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-iw-border bg-iw-surface/60 text-iw-ink-100 backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-iw-border-strong hover:bg-iw-surface-2 active:translate-y-0 active:scale-95"
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
      </Link>

      <div className="flex flex-1 flex-col items-center px-1 text-center">
        <SetupPlanetIcon />
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-iw-ink-100 sm:text-4xl">
          GAME SETUP
        </h1>
        <p className="mt-1 max-w-[22rem] text-sm text-iw-violet-300 sm:text-base">
          Customize your game and get ready to play!
        </p>
      </div>

      <div className="shrink-0">
        <ConnectionStatus />
      </div>
    </header>
  );
}
