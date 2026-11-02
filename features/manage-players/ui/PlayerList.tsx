import type { Player } from "@/game/game-types";
import type { PlayerActionResult } from "@/lib/game-setup-context";
import PlayerCard from "./PlayerCard";

export default function PlayerList({
  players,
  onRemove,
  onEdit,
}: {
  players: Player[];
  onRemove: (id: string) => void;
  onEdit: (id: string, name: string) => PlayerActionResult;
}) {
  if (players.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-iw-border px-4 py-8 text-center">
        <p className="text-sm font-semibold text-iw-ink-300">
          No players added yet
        </p>
        <p className="mt-1 text-xs text-iw-ink-500">
          Add at least 3 players to begin.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {players.map((player, index) => (
        <PlayerCard
          key={player.id}
          player={player}
          index={index}
          onRemove={() => onRemove(player.id)}
          onEdit={(name) => onEdit(player.id, name)}
        />
      ))}
    </ul>
  );
}
