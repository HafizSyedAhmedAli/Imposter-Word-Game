import { Users } from "lucide-react";
import type { PlayerStatistics } from "@/lib/statistics-aggregation";
import PlayerStatsCard from "./PlayerStatsCard";

/**
 * "Players" section (spec's STATISTICS SCREEN UX + PLAYER STATISTICS
 * UI): a stacked, mobile-friendly list rather than a wide table, since
 * this is primarily a pass-the-phone mobile game (spec's UX note).
 * `players` is expected already sorted (see
 * lib/statistics-aggregation.ts's `computePlayerStatistics`, most games
 * played first).
 */
export default function PlayerStatsList({
  players,
}: {
  players: PlayerStatistics[];
}) {
  return (
    <section
      className="animate-iw-fade-up rounded-3xl border border-iw-border bg-iw-surface/40 p-5 backdrop-blur-sm"
      style={{ animationDelay: "240ms" }}
    >
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-iw-violet-300" aria-hidden="true" />
        <p className="font-display text-lg font-bold text-iw-ink-100">
          PLAYERS
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {players.map((player) => (
          <PlayerStatsCard key={player.normalizedName} player={player} />
        ))}
      </ul>
    </section>
  );
}
