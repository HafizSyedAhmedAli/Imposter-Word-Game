// components/final-results/VotingHistoryRoundCard.tsx
import { Equal, Skull } from "lucide-react";
import PlayerAvatar from "@/components/players/PlayerAvatar";
import type { Player, VotingHistoryEntry } from "@/game/game-types";

/**
 * Seat index for a recorded player id, in the same `players` order used
 * everywhere else (VoteResultsCard, TieCard, PlayerAvatar) for stable
 * avatar colors. Falls back to seat 0 rather than crashing if a player
 * id somehow isn't found -- this view is read-only history and must
 * never throw over a data edge case.
 */
function findSeatIndex(players: Player[], playerId: string): number {
  const index = players.findIndex((player) => player.id === playerId);
  return index === -1 ? 0 : index;
}

function findPlayerName(
  players: Player[],
  playerId: string,
  fallback: string,
): string {
  return players.find((player) => player.id === playerId)?.name ?? fallback;
}

export default function VotingHistoryRoundCard({
  entry,
  players,
}: {
  entry: VotingHistoryEntry;
  players: Player[];
}) {
  const highestVotes = entry.tally.reduce(
    (max, item) => Math.max(max, item.votes),
    0,
  );

  return (
    <section className="animate-iw-fade-up w-full rounded-3xl border border-iw-border bg-iw-surface/70 p-5">
      <p className="font-display text-xs font-bold uppercase tracking-wide text-iw-violet-300">
        Round {entry.round}
      </p>

      <ul className="mt-3 flex flex-col gap-3">
        {entry.tally.map((item) => {
          const isTop = highestVotes > 0 && item.votes === highestVotes;
          return (
            <li key={item.playerId} className="flex items-center gap-3">
              <PlayerAvatar index={findSeatIndex(players, item.playerId)} />
              <span
                className={`flex-1 truncate font-display text-sm font-semibold ${
                  isTop ? "text-iw-ink-100" : "text-iw-ink-300"
                }`}
              >
                {item.playerName}
              </span>
              <span
                className={`shrink-0 font-display text-sm font-bold ${
                  isTop ? "text-iw-gold-400" : "text-iw-ink-500"
                }`}
              >
                {item.votes} {item.votes === 1 ? "vote" : "votes"}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-iw-border-strong bg-iw-surface-2/60 px-4 py-2.5">
        {entry.verdict.type === "tie" ? (
          <>
            <Equal
              className="h-4 w-4 shrink-0 text-iw-violet-300"
              aria-hidden="true"
            />
            <span className="font-display text-sm font-semibold text-iw-ink-100">
              Tie &mdash; no one eliminated
            </span>
          </>
        ) : (
          <>
            <Skull
              className="h-4 w-4 shrink-0 text-iw-gold-400"
              aria-hidden="true"
            />
            <span className="truncate font-display text-sm font-semibold text-iw-ink-100">
              Eliminated:{" "}
              {findPlayerName(
                players,
                entry.verdict.eliminatedPlayerId,
                "Unknown player",
              )}
            </span>
          </>
        )}
      </div>
    </section>
  );
}
