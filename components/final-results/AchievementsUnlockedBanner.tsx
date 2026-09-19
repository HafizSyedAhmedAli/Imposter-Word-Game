"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { playSound } from "@/shared/lib/sound-engine";
import { light } from "@/shared/lib/haptics";

/**
 * Small, additive section on the Final Results screen (spec section
 * 12): "🏆 N Achievements Unlocked -> View Achievements". Deliberately
 * minimal -- a single compact row, not a card competing with the
 * winner reveal/voting history/replay buttons already on this screen.
 * Renders `null` (nothing) when nothing unlocked this game, so games
 * that don't earn anything look exactly like they did before this
 * feature existed.
 */
export default function AchievementsUnlockedBanner({
  count,
}: {
  count: number;
}) {
  if (count <= 0) return null;

  return (
    <Link
      href="/achievements"
      onClick={() => {
        playSound("ui-tap");
        light();
      }}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-iw-gold-600/40 bg-iw-gold-500/10 px-4 py-3 font-display text-sm font-bold text-iw-gold-500 transition-colors hover:bg-iw-gold-500/20"
    >
      <Trophy className="h-4 w-4" aria-hidden="true" />
      {count} {count === 1 ? "Achievement" : "Achievements"} Unlocked — View
      Achievements
    </Link>
  );
}
