import { MAX_PLAYERS } from "@/game/game-rules";

export default function PlayerCount({ count }: { count: number }) {
  const pct = Math.min(100, (count / MAX_PLAYERS) * 100);
  const atMax = count >= MAX_PLAYERS;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
          Players
        </span>
        <span className="font-display text-lg font-bold text-iw-ink-100">
          {count}
          <span className="text-iw-ink-500"> / {MAX_PLAYERS}</span>
        </span>
      </div>

      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-iw-surface-2"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={MAX_PLAYERS}
        aria-valuenow={count}
        aria-label="Players added"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-iw-violet-500 to-iw-violet-400 transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {atMax && (
        <p className="mt-1.5 text-xs font-medium text-iw-gold-400">
          Maximum 12 players
        </p>
      )}
    </div>
  );
}
