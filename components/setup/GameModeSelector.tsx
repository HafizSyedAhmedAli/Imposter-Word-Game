import type { GameMode } from "@/game/game-types";
import { GAME_MODES } from "@/game/game-rules";
import GameModeCard from "./GameModeCard";

export default function GameModeSelector({
  mode,
  onChange,
}: {
  mode: GameMode;
  onChange: (mode: GameMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Game mode"
      className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-4"
    >
      {GAME_MODES.map((m) => (
        <GameModeCard
          key={m.id}
          mode={m.id}
          title={m.title}
          subtitle={m.subtitle}
          selected={mode === m.id}
          onSelect={() => onChange(m.id)}
        />
      ))}
    </div>
  );
}
