import { MessagesSquare } from "lucide-react";
import SectionCard from "./SectionCard";

export default function DiscussionGuideSection() {
  return (
    <SectionCard icon={MessagesSquare} title="Discussion" delayMs={300}>
      <p>
        Once everyone has seen their secret information, the discussion begins.
        Put the phone down — everyone talks it through out loud, in player
        order, then discusses freely.
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        {[
          "Talk about the word indirectly.",
          "Give clues.",
          "Listen to everyone's answers.",
          "Look for players whose answers don't fit.",
          "Watch for players who seem to be fishing for information.",
        ].map((tip) => (
          <li key={tip} className="flex items-start gap-2">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-iw-violet-400"
              aria-hidden="true"
            />
            <span>{tip}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 rounded-2xl border border-iw-border bg-iw-surface-2/50 px-4 py-3 text-sm text-iw-ink-300">
        Don&apos;t say the secret word directly — the discussion is where clues
        get traded, not where the word gets given away.
      </p>
    </SectionCard>
  );
}
