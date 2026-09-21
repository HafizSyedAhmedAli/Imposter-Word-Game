import { ArrowLeft } from "lucide-react";
import ConnectionStatus from "@/components/home/ConnectionStatus";

/**
 * Moved from `components/round/RoundPreparationHeader.tsx` into
 * `shared/ui/` (FSD migration step 7) -- takes only an `onBack`
 * callback, no domain type, so it carries no domain knowledge (same
 * reasoning as `PlayerAvatar`/`LeaveRoundDialog`, already in
 * `shared/ui/`). Used by six in-round screens: `RoundPreparationScreen`,
 * `PassPhoneScreen`, `DiscussionScreen`, `VoteScreen`, `ResultsScreen`,
 * `FinalResultsScreen` -- all repointed to `@/shared/ui/RoundPreparationHeader`.
 * (`HowToPlayHeader.tsx` only *mentions* this component in a comment; it
 * was never an importer and needed no change.)
 */
export default function RoundPreparationHeader({
  onBack,
}: {
  onBack: () => void;
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Go back"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-iw-border bg-iw-surface/60 text-iw-ink-100 backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-iw-border-strong hover:bg-iw-surface-2 active:translate-y-0 active:scale-95 cursor-pointer"
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
      </button>

      <div className="flex-1" />

      <div className="shrink-0">
        <ConnectionStatus />
      </div>
    </header>
  );
}