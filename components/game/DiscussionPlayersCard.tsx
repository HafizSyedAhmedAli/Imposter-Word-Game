import type { Player } from "@/game/game-types";
import PlayerAvatar from "@/components/players/PlayerAvatar";

/**
 * The plain roster for this round -- distinct from
 * DiscussionClueOrderCard, which shows the same players but framed as a
 * numbered turn order. Kept as its own card (rather than merged into
 * the clue-order card) so the two ideas ("who's playing" vs "what order
 * they go in") stay visually separate, per Screen 6 spec, "Player
 * Display".
 *
 * Every player renders identically -- no role, word, hint, or imposter
 * flag is available to this component at all.
 */
export default function DiscussionPlayersCard({
  players,
}: {
  players: Player[];
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
            <PlayerAvatar index={index} />
            <span className="pr-1 text-sm font-semibold text-iw-ink-100">
              {player.name}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
