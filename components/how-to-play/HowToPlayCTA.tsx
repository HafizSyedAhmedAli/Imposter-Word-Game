"use client";

import Link from "next/link";
import { Play, ArrowLeft } from "lucide-react";
import { playSound } from "@/lib/sound-engine";

/**
 * "Start Playing" reuses the existing /setup route (same destination as
 * PrimaryPlayButton.tsx on Home) and the same gold gradient button style
 * used throughout the app (PlayerRevealCard, ImposterRevealCard,
 * ResultsScreen, DiscussionControls). No new game-starting logic.
 */
export default function HowToPlayCTA() {
  return (
    <div
      className="animate-iw-fade-up flex flex-col items-center gap-3 pb-2"
      style={{ animationDelay: "580ms" }}
    >
      <Link
        href="/setup"
        onClick={() => playSound("game-start")}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
      >
        <Play className="h-5 w-5" fill="currentColor" aria-hidden="true" />
        START PLAYING
      </Link>

      <Link
        href="/"
        onClick={() => playSound("ui-tap")}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-iw-ink-500 transition-colors hover:text-iw-ink-100"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
        Back to Home
      </Link>
    </div>
  );
}
