// components/game/DiscussionControls.tsx
import { ArrowRight } from "lucide-react";

/**
 * The only forward action Screen 6 owns. Deliberately does not implement
 * voting itself -- it only navigates to the (separate) voting
 * destination once players decide they're ready, matching the intended
 * Discussion -> START VOTING -> Voting Screen architecture (see Screen 6
 * spec, "Discussion Controls").
 */
export default function DiscussionControls({
  expired,
  onStartVoting,
}: {
  expired: boolean;
  onStartVoting: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onStartVoting}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
      >
        START VOTING
        <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
      </button>

      <p className="text-xs text-iw-ink-500">
        {expired
          ? "Time's up — start voting when everyone's ready."
          : "When everyone's ready to vote, tap above."}
      </p>
    </div>
  );
}
