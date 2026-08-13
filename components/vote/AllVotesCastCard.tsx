import { ArrowRight, CheckCircle2 } from "lucide-react";

/**
 * Deliberately the only place results are reached from -- results are
 * never revealed automatically the instant the final vote is submitted
 * (spec section 37-38), so the last voter always sees their own vote
 * recorded first, on their own turn, before anything moves on.
 */
export default function AllVotesCastCard({
  onRevealResults,
}: {
  onRevealResults: () => void;
}) {
  return (
    <section className="animate-iw-fade-up flex flex-col items-center gap-6 text-center">
      <div className="animate-iw-glow-pulse flex h-24 w-24 items-center justify-center rounded-full border border-iw-gold-500/50 bg-gradient-to-b from-iw-gold-500/20 to-iw-surface/60">
        <CheckCircle2
          className="h-10 w-10 text-iw-gold-400"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      <div>
        <p className="font-display text-2xl font-bold text-iw-ink-100">
          ALL VOTES CAST
        </p>
        <p className="mt-2 text-sm text-iw-ink-500">
          Everyone has voted. The results are ready.
        </p>
      </div>

      <button
        type="button"
        onClick={onRevealResults}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
      >
        REVEAL RESULTS
        <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
      </button>
    </section>
  );
}
