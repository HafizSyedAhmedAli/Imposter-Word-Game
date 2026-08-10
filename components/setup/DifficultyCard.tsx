import { Smile, Meh, Angry, Check, type LucideIcon } from "lucide-react";
import type { Difficulty } from "@/game/game-types";

const DIFFICULTY_ICON: Record<Difficulty, LucideIcon> = {
  easy: Smile,
  medium: Meh,
  hard: Angry,
};

const DIFFICULTY_THEME: Record<
  Difficulty,
  {
    border: string;
    borderSelected: string;
    glow: string;
    bg: string;
    text: string;
    iconBg: string;
  }
> = {
  easy: {
    border: "border-emerald-500/30",
    borderSelected: "border-emerald-400",
    glow: "shadow-[0_0_0_1px_rgba(52,211,153,0.4),0_0_22px_-6px_rgba(52,211,153,0.55)]",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    iconBg: "bg-emerald-500/20",
  },
  medium: {
    border: "border-iw-gold-600/30",
    borderSelected: "border-iw-gold-400",
    glow: "shadow-[0_0_0_1px_rgba(255,201,60,0.45),0_0_22px_-6px_rgba(255,184,0,0.55)]",
    bg: "bg-iw-gold-500/10",
    text: "text-iw-gold-400",
    iconBg: "bg-iw-gold-500/20",
  },
  hard: {
    border: "border-iw-red/30",
    borderSelected: "border-iw-red",
    glow: "shadow-[0_0_0_1px_rgba(255,77,94,0.45),0_0_22px_-6px_rgba(255,77,94,0.55)]",
    bg: "bg-iw-red/10",
    text: "text-iw-red",
    iconBg: "bg-iw-red/20",
  },
};

export default function DifficultyCard({
  id,
  title,
  description,
  selected,
  onSelect,
}: {
  id: Difficulty;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = DIFFICULTY_ICON[id];
  const theme = DIFFICULTY_THEME[id];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative flex flex-1 flex-col items-start gap-2 rounded-2xl border px-3.5 py-3.5 text-left transition-all duration-150 sm:px-4 sm:py-4 cursor-pointer ${
        theme.bg
      } ${selected ? `${theme.borderSelected} ${theme.glow}` : `${theme.border} hover:-translate-y-0.5`}`}
    >
      {selected && (
        <span
          className={`absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full ${theme.iconBg} ${theme.text} animate-iw-fade-in`}
          aria-hidden="true"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full ${theme.iconBg} ${theme.text}`}
      >
        <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span
        className={`font-display text-sm font-bold tracking-wide ${theme.text} sm:text-base`}
      >
        {title}
      </span>
      <span className="text-xs leading-snug text-iw-ink-300 sm:text-sm">
        {description}
      </span>
    </button>
  );
}
