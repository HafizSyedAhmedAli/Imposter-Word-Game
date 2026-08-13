// components/results/VerdictCard.tsx
import { ShieldAlert, ShieldCheck } from "lucide-react";

/**
 * The dramatic role-reveal card -- red/pink for a caught imposter,
 * purple/blue for a wrong guess (spec's "ROLE REVEAL"). Deliberately
 * takes `remainingImposterCount` rather than any imposter's identity or
 * count-minus-one math done inline, so it's impossible for this
 * component to accidentally leak who the other imposters are (spec's
 * "IMPORTANT GAME RULE" -- catching one never reveals the rest).
 */
export default function VerdictCard({
  playerName,
  wasImposter,
  remainingImposterCount,
}: {
  playerName: string;
  wasImposter: boolean;
  /** Imposters still hidden after this verdict. Only shown when > 0 and
   *  the group just caught one, as a hint the hunt isn't over. */
  remainingImposterCount: number;
}) {
  return (
    <section
      className="animate-iw-fade-up flex flex-col items-center gap-3 text-center"
      style={{ animationDelay: "0.6s" }}
      aria-live="polite"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
        The Verdict
      </p>

      <div
        className={`flex w-full flex-col items-center gap-3 rounded-3xl border p-6 ${
          wasImposter
            ? "border-iw-red/50 bg-gradient-to-b from-iw-red/15 to-iw-surface/70"
            : "border-iw-violet-400/50 bg-gradient-to-b from-iw-violet-500/15 to-iw-surface/70"
        }`}
      >
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full ${
            wasImposter ? "bg-iw-red/20" : "bg-iw-violet-500/20"
          }`}
          aria-hidden="true"
        >
          {wasImposter ? (
            <ShieldAlert className="h-7 w-7 text-iw-red" strokeWidth={2} />
          ) : (
            <ShieldCheck
              className="h-7 w-7 text-iw-violet-300"
              strokeWidth={2}
            />
          )}
        </div>

        <p
          className={`font-display text-xl font-bold ${
            wasImposter ? "text-iw-red" : "text-iw-violet-300"
          }`}
        >
          {wasImposter ? "IMPOSTER CAUGHT!" : "WRONG PLAYER!"}
        </p>

        <p className="font-display text-lg font-semibold text-iw-ink-100">
          {playerName}{" "}
          <span className="font-body text-sm font-normal text-iw-ink-500">
            {wasImposter ? "was an IMPOSTER." : "was NOT an imposter."}
          </span>
        </p>

        <p className="text-sm text-iw-ink-500">
          {wasImposter
            ? remainingImposterCount > 0
              ? "The crew found one of the imposters! More may still be hiding."
              : "The crew found the imposter!"
            : "The imposter(s) fooled the group."}
        </p>
      </div>
    </section>
  );
}
