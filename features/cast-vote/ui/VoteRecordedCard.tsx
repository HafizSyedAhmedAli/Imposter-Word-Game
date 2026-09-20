import { CheckCircle2 } from "lucide-react";

/**
 * Shown immediately after a vote is submitted, replacing the voting
 * options entirely (spec section 26-31) -- this component never
 * receives the vote that was just cast as a prop, so there is no path
 * by which it could leak it (not even into a hidden attribute or
 * console log). It only ever knows the *next* voter's name.
 */
export default function VoteRecordedCard({
  nextVoterName,
  onReady,
}: {
  nextVoterName: string;
  onReady: () => void;
}) {
  return (
    <section
      className="animate-iw-fade-up flex flex-col items-center gap-6 text-center"
      aria-live="polite"
    >
      <div className="animate-iw-glow-pulse flex h-24 w-24 items-center justify-center rounded-full border border-iw-online/50 bg-gradient-to-b from-iw-online/15 to-iw-surface/60">
        <CheckCircle2
          className="h-10 w-10 text-iw-online"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      <div>
        <p className="font-display text-2xl font-bold text-iw-ink-100">
          VOTE RECORDED
        </p>
        <p className="mt-2 text-sm text-iw-ink-500">
          Your vote has been submitted.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
          Pass the phone to
        </p>
        <p className="mt-1 font-display text-5xl font-bold text-iw-violet-300">
          {nextVoterName}
        </p>
      </div>

      <button
        type="button"
        onClick={onReady}
        className="w-full cursor-pointer rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
      >
        I&apos;M READY
      </button>
    </section>
  );
}
