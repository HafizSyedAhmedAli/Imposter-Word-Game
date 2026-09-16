"use client";

import { playSound } from "@/lib/sound-engine";
import { light } from "@/lib/haptics";
import type { AchievementPlayerContext } from "@/lib/achievements/engine";

// Same deterministic, name-hash palette convention as
// components/statistics/PlayerStatsCard.tsx -- a lifetime per-player
// achievement set has no "seat" to key off, so this keys by a hash of
// the normalized name instead, exactly like that card does.
const AVATAR_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#84cc16",
  "#f43f5e",
];

function colorFor(normalizedName: string): string {
  let hash = 0;
  for (let i = 0; i < normalizedName.length; i++) {
    hash = (hash * 31 + normalizedName.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

/**
 * This is a pass-the-phone game (spec section 5/23) -- achievements are
 * always specific to one local player, never a shared/aggregate set. A
 * horizontal, scrollable chip row (same mobile-first spirit as
 * PlayerStatsList's stacked cards) lets whoever is holding the phone
 * quickly switch to their own name rather than only ever seeing
 * whoever's alphabetically/historically first.
 */
export default function AchievementPlayerSelector({
  players,
  selectedName,
  onSelect,
}: {
  players: AchievementPlayerContext[];
  selectedName: string;
  onSelect: (normalizedName: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Select a player"
      className="flex w-full gap-2 overflow-x-auto pb-1"
    >
      {players.map((player) => {
        const isSelected = player.normalizedName === selectedName;
        return (
          <button
            key={player.normalizedName}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => {
              if (!isSelected) {
                playSound("ui-tap");
                light();
                onSelect(player.normalizedName);
              }
            }}
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 transition-colors duration-150 ${
              isSelected
                ? "border-iw-violet-500 bg-iw-violet-500/20"
                : "border-iw-border bg-iw-surface/60 hover:border-iw-border-strong"
            }`}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold text-white shadow-inner"
              style={{ backgroundColor: colorFor(player.normalizedName) }}
              aria-hidden="true"
            >
              {initial(player.displayName)}
            </span>
            <span className="font-display text-sm font-semibold text-iw-ink-100">
              {player.displayName}
            </span>
          </button>
        );
      })}
    </div>
  );
}
