// components/results/TieCard.tsx
import { Equal } from "lucide-react";
import PlayerAvatar from "@/components/players/PlayerAvatar";
import type { VoteTally } from "@/game/results-flow";

/**
 * Spec is explicit: never silently pick a winner on a tie. This card is
 * the entire tie-handling UI -- ResultsScreen renders it INSTEAD of
 * MostVotedCard/VerdictCard, never alongside them.
 */
export default function TieCard({ tied }: { tied: VoteTally[] }) {
  return (
    <section className="animate-iw-fade-up flex flex-col items-center gap-4 rounded-3xl border border-iw-border-strong bg-iw-surface/70 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-iw-violet-500/20">
        <Equal className="h-7 w-7 text-iw-violet-300" aria-hidden="true" />
      </div>

      <p className="font-display text-xl font-bold text-iw-ink-100">
        IT&apos;S A TIE!
      </p>

      <ul className="flex w-full flex-col gap-2">
        {tied.map((entry) => (
          <li
            key={entry.player.id}
            className="flex items-center gap-3 rounded-2xl border border-iw-border bg-iw-surface-2/60 px-4 py-2.5"
          >
            <PlayerAvatar index={entry.index} />
            <span className="flex-1 text-left font-display text-sm font-semibold text-iw-ink-100">
              {entry.player.name}
            </span>
            <span className="font-display text-sm font-bold text-iw-ink-300">
              {entry.votes} {entry.votes === 1 ? "vote" : "votes"}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-sm text-iw-ink-500">
        No one is eliminated this round.
      </p>
    </section>
  );
}
