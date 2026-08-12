// components/game/DiscussionStatusCard.tsx
import { MessagesSquare } from "lucide-react";

/**
 * Purely public copy -- announces that discussion is underway and how to
 * behave during it. Contains no reference to the round's word, hint, or
 * any player's role (see Screen 6 spec, "Important Privacy Rule").
 */
export default function DiscussionStatusCard() {
  return (
    <section className="animate-iw-fade-up flex flex-col items-center gap-3 text-center">
      <div className="animate-iw-float flex h-16 w-16 items-center justify-center rounded-full border border-iw-violet-400/40 bg-gradient-to-b from-iw-violet-500/25 to-iw-surface/60">
        <MessagesSquare
          className="h-7 w-7 text-iw-violet-300"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      <div>
        <p className="font-display text-2xl font-bold text-iw-ink-100">
          DISCUSSION
        </p>
        <p className="mt-1 text-sm text-iw-ink-500">
          Discuss the word. Give clues without making it too obvious.
        </p>
      </div>
    </section>
  );
}
