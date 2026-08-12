import { Eye, Lock } from "lucide-react";

export default function PrivateRevealPrompt({
  playerName,
  onReveal,
}: {
  playerName: string;
  onReveal: () => void;
}) {
  return (
    <section
      className="animate-iw-fade-up flex flex-col items-center gap-6 text-center"
      aria-live="polite"
    >
      <div className="animate-iw-glow-pulse flex h-24 w-24 items-center justify-center rounded-full border border-iw-gold-500/50 bg-gradient-to-b from-iw-gold-500/20 to-iw-surface/60">
        <Lock
          className="h-10 w-10 text-iw-gold-400"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      <div>
        <p className="font-display text-2xl font-bold text-iw-ink-100">
          PRIVATE REVEAL
        </p>
        <p className="mt-2 text-sm text-iw-ink-500">
          {playerName}, only you should be looking right now.
        </p>
      </div>

      <p className="text-sm text-iw-ink-500">
        Tap below when you&apos;re ready to see your role.
      </p>

      <button
        type="button"
        onClick={onReveal}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
      >
        <Eye className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        REVEAL MY ROLE
      </button>
    </section>
  );
}
