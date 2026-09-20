// Deterministic palette so a player's color stays stable while other
// players are added/removed around them (keyed by seat position, not by
// name, so it never depends on external images/network).
//
// Moved from `components/players/PlayerAvatar.tsx` into `shared/ui/`
// (FSD migration step 6) -- unlike the rest of `components/players/`,
// this component takes only a numeric `index`, no `Player` domain type,
// so it carries no domain knowledge and is a genuine `shared/ui`
// candidate per `shared/README.md`'s own "if/when extracted" note. It's
// also reused well beyond the Players screen -- voting, pass, results,
// and final-results cards all render it -- which is what makes it a
// shared primitive rather than part of the `features/manage-players`
// slice. All 8 consumers repointed to `@/shared/ui/PlayerAvatar`.
const AVATAR_COLORS = [
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#22c55e", // green
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
  "#eab308", // gold
  "#ef4444", // red
  "#06b6d4", // cyan
  "#a855f7", // purple
  "#84cc16", // lime
  "#f43f5e", // rose
];

export default function PlayerAvatar({ index }: { index: number }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white shadow-inner"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {index + 1}
    </span>
  );
}