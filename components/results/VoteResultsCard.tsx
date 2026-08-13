// components/results/VoteResultsCard.tsx
"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import PlayerAvatar from "@/components/players/PlayerAvatar";
import type { VoteTally } from "@/game/results-flow";

/**
 * One player's row + animated bar. The bar mounts at 0% and grows to its
 * real width on the next frame -- CSS `transition` only fires on a value
 * *change*, so rendering the final width directly on first paint would
 * skip the "bars animate to their final values" requirement entirely.
 * `prefers-reduced-motion` is already handled globally (globals.css
 * collapses all transition durations to ~0), so no extra branching is
 * needed here.
 */
function VoteRow({
  entry,
  isTop,
  highestVotes,
}: {
  entry: VoteTally;
  isTop: boolean;
  highestVotes: number;
}) {
  const targetWidth = highestVotes > 0 ? (entry.votes / highestVotes) * 100 : 0;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setWidth(targetWidth));
    return () => cancelAnimationFrame(frame);
  }, [targetWidth]);

  const label = `${entry.votes} ${entry.votes === 1 ? "vote" : "votes"}`;

  return (
    <li>
      <div className="flex items-center gap-3">
        <PlayerAvatar index={entry.index} />
        <span
          className={`flex-1 font-display text-sm font-semibold ${
            isTop ? "text-iw-ink-100" : "text-iw-ink-300"
          }`}
        >
          {entry.player.name}
        </span>
        <span
          className={`font-display text-sm font-bold ${
            isTop ? "text-iw-gold-400" : "text-iw-ink-500"
          }`}
        >
          {label}
        </span>
      </div>

      {/* Decorative -- the count is already announced as text above,
          the bar itself carries no information a screen reader needs. */}
      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-iw-surface-2"
        aria-hidden="true"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${
            isTop
              ? "bg-gradient-to-r from-iw-gold-400 to-iw-gold-500"
              : "bg-iw-violet-500/70"
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    </li>
  );
}

export default function VoteResultsCard({
  tally,
  highestVotes,
}: {
  tally: VoteTally[];
  highestVotes: number;
}) {
  return (
    <section className="animate-iw-fade-up w-full rounded-3xl border border-iw-border bg-iw-surface/70 p-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-iw-violet-300" aria-hidden="true" />
        <p className="font-display text-lg font-bold text-iw-ink-100">
          VOTE RESULTS
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-4">
        {tally.map((entry) => (
          <VoteRow
            key={entry.player.id}
            entry={entry}
            isTop={highestVotes > 0 && entry.votes === highestVotes}
            highestVotes={highestVotes}
          />
        ))}
      </ul>
    </section>
  );
}
