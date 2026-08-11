// Deterministic palette so a player's color stays stable while other
// players are added/removed around them (keyed by seat position, not by
// name, so it never depends on external images/network).
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
