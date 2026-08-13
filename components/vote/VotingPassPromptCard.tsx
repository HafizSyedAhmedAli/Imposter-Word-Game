import { Lock, Vote } from "lucide-react";

/**
 * The gate before a voter's private ballot is shown. Deliberately never
 * renders the voting options itself -- a player must explicitly confirm
 * they're holding the phone privately first (spec section 6). This is
 * also what a mid-voting page refresh recovers to for whoever the
 * current voter is (see game/vote-flow.ts's `getCurrentVoter`), so this
 * component makes no assumption about whether it's player 1 or a later
 * voter.
 */
export default function VotingPassPromptCard({
  voterName,
  onReady,
}: {
  voterName: string;
  onReady: () => void;
}) {
  return (
    <section className="animate-iw-fade-up flex flex-col items-center gap-6 text-center">
      <div className="animate-iw-float flex h-20 w-20 items-center justify-center rounded-full border border-iw-violet-400/40 bg-gradient-to-b from-iw-violet-500/25 to-iw-surface/60">
        <Vote
          className="h-9 w-9 text-iw-violet-300"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      <div>
        <p className="font-display text-2xl font-bold text-iw-ink-100">
          TIME TO VOTE
        </p>
        <p className="mt-2 text-sm text-iw-ink-500">
          Who do you think is the imposter?
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
          Pass the phone to
        </p>
        <p className="mt-1 font-display text-5xl font-bold text-iw-violet-300">
          {voterName}
        </p>
      </div>

      <div className="flex w-full items-start gap-3 rounded-3xl border border-iw-border bg-iw-surface/60 p-4 text-left backdrop-blur-sm">
        <Lock
          className="mt-0.5 h-5 w-5 shrink-0 text-iw-violet-300"
          strokeWidth={2.5}
          aria-hidden="true"
        />
        <div>
          <p className="font-display text-sm font-bold text-iw-ink-100">
            KEEP YOUR VOTE SECRET
          </p>
          <p className="mt-0.5 text-sm text-iw-ink-500">
            Only {voterName} should be looking at the screen.
          </p>
        </div>
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
