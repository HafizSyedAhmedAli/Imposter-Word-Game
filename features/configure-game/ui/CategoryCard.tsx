import {
  Shuffle,
  Pizza,
  PawPrint,
  Volleyball,
  Clapperboard,
  Globe,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/game/game-types";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  random: Shuffle,
  food: Pizza,
  animals: PawPrint,
  sports: Volleyball,
  movies: Clapperboard,
  countries: Globe,
  more: MoreHorizontal,
};

export default function CategoryCard({
  id,
  label,
  selected,
  onSelect,
}: {
  id: Category;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = CATEGORY_ICONS[id] ?? MoreHorizontal;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex w-[92px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border px-3 py-3.5 text-center transition-all duration-150 cursor-pointer ${
        selected
          ? "border-iw-violet-400 bg-iw-violet-500/15 shadow-[0_0_0_1px_rgba(139,92,246,0.4),0_0_18px_-6px_rgba(139,92,246,0.6)]"
          : "border-iw-border bg-iw-surface/60 hover:-translate-y-0.5 hover:border-iw-border-strong hover:bg-iw-surface-2"
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          selected
            ? "bg-iw-violet-500/25 text-iw-violet-300"
            : "bg-iw-surface-2 text-iw-ink-300"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span
        className={`text-xs font-semibold ${selected ? "text-iw-ink-100" : "text-iw-ink-300"}`}
      >
        {label}
      </span>
    </button>
  );
}
