// components/results/MostVotedCard.tsx
import PlayerAvatar from "@/components/players/PlayerAvatar";

/**
 * The "MOST VOTED" beat between the vote breakdown and the verdict
 * reveal. Purely presentational -- it never decides who was voted out,
 * ResultsScreen already resolved that via game/results-flow.ts before
 * this renders.
 */
export default function MostVotedCard({
  name,
  index,
  votes,
}: {
  name: string;
  index: number;
  votes: number;
}) {
  return (
    <section className="animate-iw-fade-up flex flex-col items-center gap-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
        Most Voted
      </p>

      <div className="animate-iw-glow-pulse flex h-24 w-24 items-center justify-center rounded-full border border-iw-gold-500/50 bg-gradient-to-b from-iw-gold-500/15 to-iw-surface/60">
        <PlayerAvatar index={index} />
      </div>

      <p className="font-display text-3xl font-bold text-iw-ink-100">{name}</p>
      <p className="font-display text-sm font-semibold text-iw-gold-400">
        {votes} {votes === 1 ? "VOTE" : "VOTES"}
      </p>

      <p
        className="animate-iw-fade-in mt-1 text-sm text-iw-ink-500"
        style={{ animationDelay: "0.3s" }}
      >
        Let&apos;s find out...
      </p>
    </section>
  );
}
