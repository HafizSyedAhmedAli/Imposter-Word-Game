import type { Difficulty } from "@/game/game-types";
import { DIFFICULTIES } from "@/game/game-rules";
import DifficultyCard from "./DifficultyCard";

export default function DifficultySelector({
  difficulty,
  onChange,
}: {
  difficulty: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Difficulty"
      className="flex flex-col gap-2.5 sm:flex-row"
    >
      {DIFFICULTIES.map((d) => (
        <DifficultyCard
          key={d.id}
          id={d.id}
          title={d.title}
          description={d.description}
          selected={difficulty === d.id}
          onSelect={() => onChange(d.id)}
        />
      ))}
    </div>
  );
}
