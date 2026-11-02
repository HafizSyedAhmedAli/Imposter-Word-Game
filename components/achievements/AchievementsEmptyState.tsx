import Link from "next/link";
import { Play, Trophy } from "lucide-react";
import { playSound } from "@/shared/lib/sound-engine";

/**
 * Shown when no completed games are stored locally yet, so there is no
 * local player to show achievements for -- same shape and copy
 * convention as components/statistics/StatisticsEmptyState.tsx.
 */
export default function AchievementsEmptyState() {
  return (
    <section
      className="animate-iw-fade-up flex flex-col items-center gap-3 rounded-3xl border border-iw-border bg-iw-surface/40 px-6 py-10 text-center backdrop-blur-sm"
      style={{ animationDelay: "80ms" }}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-iw-border-strong bg-iw-surface-2 text-iw-gold-500">
        <Trophy className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="font-display text-lg font-bold text-iw-ink-100">
        No achievements yet
      </p>
      <p className="max-w-xs text-sm text-iw-ink-500">
        Play a game to start unlocking badges.
      </p>
      <Link
        href="/setup"
        onClick={() => playSound("game-start")}
        className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-5 py-3 font-display text-sm font-bold text-iw-gold-ink transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
      >
        <Play className="h-4 w-4" fill="currentColor" aria-hidden="true" />
        PLAY GAME
      </Link>
    </section>
  );
}
