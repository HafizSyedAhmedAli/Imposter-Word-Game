import { Vote, Equal } from "lucide-react";
import SectionCard from "./SectionCard";

export default function VotingGuideSection() {
  return (
    <SectionCard icon={Vote} title="Voting" delayMs={340}>
      <p>
        When discussion ends, everyone votes for the player they believe is an
        Imposter — privately, one at a time, passing the phone between voters
        just like the Secret Reveal. You can&apos;t vote for yourself or for a
        player who&apos;s already been eliminated.
      </p>
      <p className="mt-3 rounded-2xl border border-iw-border bg-iw-surface-2/50 px-4 py-3 text-sm text-iw-ink-300">
        Choose carefully. Eliminating a Crew player helps the Imposters.
      </p>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-iw-violet-400/30 bg-iw-violet-500/10 px-4 py-3">
        <Equal
          className="mt-0.5 h-4 w-4 shrink-0 text-iw-violet-300"
          strokeWidth={2.25}
          aria-hidden="true"
        />
        <p className="text-sm text-iw-ink-300">
          <span className="font-display font-bold text-iw-violet-300">
            If it&apos;s a tie:
          </span>{" "}
          no one is eliminated that round, and the game moves back into
          discussion for another vote among the same players.
        </p>
      </div>
    </SectionCard>
  );
}
