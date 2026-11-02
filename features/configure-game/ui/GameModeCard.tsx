import { Check } from "lucide-react";
import type { GameMode } from "@/game/game-types";
import ImposterMiniMascot from "./mascots/ImposterMiniMascot";
import MysteryCube from "./mascots/MysteryCube";

const MASCOT_COUNT: Record<GameMode, number> = {
  classic: 1,
  double: 2,
  triple: 3,
  random: 0,
};

function GameModeArt({ mode }: { mode: GameMode }) {
  const count = MASCOT_COUNT[mode];

  if (mode === "random") {
    return <MysteryCube size={52} />;
  }

  return (
    <div
      className="flex items-center justify-center"
      style={{ marginLeft: count > 1 ? -14 : 0 }}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={i > 0 ? "-ml-5" : ""} style={{ zIndex: i }}>
          <ImposterMiniMascot
            size={count === 1 ? 56 : 44}
            uid={`${mode}-${i}`}
          />
        </div>
      ))}
    </div>
  );
}

export default function GameModeCard({
  mode,
  title,
  subtitle,
  selected,
  onSelect,
}: {
  mode: GameMode;
  title: string;
  subtitle: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`group relative flex w-[148px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center backdrop-blur-sm transition-all duration-150 sm:w-auto cursor-pointer ${
        selected
          ? "border-iw-violet-400 bg-iw-violet-500/15 shadow-[0_0_0_1px_rgba(139,92,246,0.4),0_0_24px_-4px_rgba(139,92,246,0.55)]"
          : "border-iw-border bg-iw-surface/60 hover:-translate-y-0.5 hover:border-iw-border-strong hover:bg-iw-surface-2"
      }`}
    >
      {selected && (
        <span
          className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-iw-violet-500 text-white shadow-[0_2px_8px_-1px_rgba(139,92,246,0.7)] animate-iw-fade-in"
          aria-hidden="true"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}

      <div className="flex h-16 items-center justify-center">
        <GameModeArt mode={mode} />
      </div>

      <span className="font-display text-sm font-semibold tracking-wide text-iw-ink-100 sm:text-base">
        {title}
      </span>
      <span className="text-xs font-semibold text-iw-violet-300 sm:text-sm">
        {subtitle}
      </span>
    </button>
  );
}
