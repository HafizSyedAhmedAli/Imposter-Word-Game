import { ShieldAlert } from "lucide-react";

/**
 * The confirmation step spec section 22 prefers over an immediate
 * submit-on-tap. `targetName` is only ever shown to the voter
 * themselves, on their own private screen -- it's discarded the moment
 * they confirm or go back, never surfacing anywhere else (spec's "Vote
 * Privacy" section).
 */
export default function ConfirmVoteCard({
  targetName,
  onConfirm,
  onGoBack,
}: {
  targetName: string;
  onConfirm: () => void;
  onGoBack: () => void;
}) {
  return (
    <section
      className="animate-iw-fade-up flex flex-col items-center gap-6 text-center"
      aria-live="polite"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-iw-gold-500/50 bg-gradient-to-b from-iw-gold-500/20 to-iw-surface/60">
        <ShieldAlert
          className="h-9 w-9 text-iw-gold-400"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      <div>
        <p className="font-display text-2xl font-bold text-iw-ink-100">
          VOTE FOR {targetName.toUpperCase()}?
        </p>
        <p className="mt-2 text-sm text-iw-ink-500">
          Your vote cannot be changed after submission.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={onConfirm}
          className="w-full cursor-pointer rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
        >
          CONFIRM VOTE
        </button>
        <button
          type="button"
          onClick={onGoBack}
          className="w-full cursor-pointer rounded-2xl border border-iw-border bg-iw-surface-2 px-6 py-3 font-display text-sm font-bold text-iw-ink-100 transition-colors hover:border-iw-border-strong"
        >
          GO BACK
        </button>
      </div>
    </section>
  );
}
