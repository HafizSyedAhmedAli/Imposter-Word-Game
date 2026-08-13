import { Player } from "@/game/game-types";
import PlayerAvatar from "../players/PlayerAvatar";

export default function DiscussionPlayersCard({
  players,
  indexById,
}: {
  players: Player[];
  /** Stable per-seat index keyed off the FULL original roster. Optional
   *  and defaults to array position for backward compatibility, but
   *  round 2+ must pass this -- otherwise a filtered (eliminated-player-
   *  excluded) list re-numbers from 0 and survivors' avatar colors
   *  visibly shift after every elimination. */
  indexById?: Map<string, number>;
}) {
  return (
    <section className="w-full rounded-3xl border border-iw-border bg-iw-surface/60 p-4 backdrop-blur-sm sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
        Players ({players.length})
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {players.map((player, index) => (
          <li
            key={player.id}
            className="flex items-center gap-2 rounded-full border border-iw-border bg-iw-surface/40 px-2.5 py-1.5"
          >
            <PlayerAvatar index={indexById?.get(player.id) ?? index} />
            <span className="pr-1 text-sm font-semibold text-iw-ink-100">
              {player.name}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
