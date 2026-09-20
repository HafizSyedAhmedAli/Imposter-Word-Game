import { TimerOff } from "lucide-react";

/**
 * Shown when the configured voting timer reaches zero. Deliberately
 * does nothing to the vote data itself -- there is no game rule yet for
 * what an incomplete vote means, so this only ever informs and lets
 * play continue; it must never silently fabricate a vote for whoever
 * hasn't gone yet (spec section 51-53).
 */
export default function TimesUpCard({
  votesCast,
  totalPlayers,
  onContinue,
}: {
  votesCast: number;
  totalPlayers: number;
  onContinue: () => void;
}) {
  return (
    <section
      className="animate-iw-fade-up flex flex-col items-center gap-6 text-center"
      aria-live="polite"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-iw-red/40 bg-iw-red/10">
        <TimerOff
          className="h-9 w-9 text-iw-red"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      <div>
        <p className="font-display text-2xl font-bold text-iw-ink-100">
          TIME&apos;S UP
        </p>
        <p className="mt-2 text-sm text-iw-ink-500">
          {votesCast} of {totalPlayers} players have voted so far.
        </p>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="w-full cursor-pointer rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
      >
        CONTINUE
      </button>
    </section>
  );
}
