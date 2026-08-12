import { Lightbulb } from "lucide-react";

/**
 * Short, public gameplay reminder. Wording deliberately avoids anything
 * implying the phone needs to be touched again during discussion (spec:
 * "Do not say 'when it's your turn, tap Next Player'") -- the phone
 * stays on the table from here until voting.
 */
export default function DiscussionTipsCard() {
  return (
    <div className="flex w-full items-start gap-3 rounded-3xl border border-iw-border bg-iw-surface/60 p-4 text-left backdrop-blur-sm">
      <Lightbulb
        className="mt-0.5 h-5 w-5 shrink-0 text-iw-gold-400"
        strokeWidth={2.5}
        aria-hidden="true"
      />
      <div>
        <p className="font-display text-sm font-bold text-iw-ink-100">
          HOW THIS ROUND WORKS
        </p>
        <p className="mt-0.5 text-sm text-iw-ink-500">
          Put the phone down. Give your clue in player order, starting with the first player. After everyone has given a clue, discuss who you think is the imposter.
        </p>
      </div>
    </div>
  );
}
