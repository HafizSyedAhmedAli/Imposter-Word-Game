import type { PlayerStatistics } from "@/entities/statistics";

// Same deterministic, seat-agnostic palette convention as
// components/players/PlayerAvatar.tsx, but keyed by a hash of the
// player's normalized name instead of seat index -- a lifetime
// per-player stat has no "seat" to key off, and a name-based hash still
// keeps one player's color stable across every render.
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
 * One local player's lifetime stat summary (spec's "PLAYER STATISTICS
 * UI"). Deliberately just the headline numbers, not a full profile
 * screen -- tapping doesn't drill into more detail, per the spec's
 * "keep this implementation focused on Statistics" instruction.
 */
export default function PlayerStatsCard({
  player,
}: {
  player: PlayerStatistics;
}) {
  return (
    <li className="flex animate-iw-fade-in items-center gap-3 rounded-2xl border border-iw-border bg-iw-surface/60 px-4 py-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white shadow-inner"
        style={{ backgroundColor: colorFor(player.normalizedName) }}
        aria-hidden="true"
      >
        {initial(player.displayName)}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-display text-base font-semibold text-iw-ink-100">
            {player.displayName}
          </span>
          <span className="shrink-0 text-xs font-semibold text-iw-ink-500">
            {player.gamesPlayed} {player.gamesPlayed === 1 ? "game" : "games"}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-iw-ink-500">
          <span>
            Win Rate{" "}
            <span className="font-semibold text-iw-ink-100">
              {player.winRate}%
            </span>
          </span>
          <span>
            Crew{" "}
            <span className="font-semibold text-iw-ink-100">
              {player.crewGames}
            </span>
          </span>
          <span>
            Imposter{" "}
            <span className="font-semibold text-iw-ink-100">
              {player.imposterGames}
            </span>
          </span>
          <span>
            Voted Out{" "}
            <span className="font-semibold text-iw-ink-100">
              {player.timesVotedOut}
            </span>
          </span>
        </div>
      </div>
    </li>
  );
}
