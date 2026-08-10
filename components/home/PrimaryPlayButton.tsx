import Link from "next/link";
import { Play } from "lucide-react";

export default function PrimaryPlayButton() {
  return (
    <Link
      href="/setup"
      className="group relative flex w-full items-center gap-4 rounded-[1.75rem] border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-5 py-4 text-left shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 ease-out animate-iw-glow-pulse hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-iw-gold-ink/90 text-iw-gold-100 shadow-inner">
        <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" aria-hidden="true" />
      </span>
      <span className="flex flex-col">
        <span className="font-display text-2xl font-semibold leading-none text-iw-gold-ink">
          PLAY GAME
        </span>
        <span className="mt-1 text-sm font-semibold text-iw-gold-ink/70">
          Start a new game
        </span>
      </span>
    </Link>
  );
}
