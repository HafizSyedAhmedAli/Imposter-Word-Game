// app/results/page.tsx  (new stub -- Screen 7 (Voting) had nowhere real
// to send REVEAL RESULTS to, same role /voting played for Screen 6
// before this task)
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Minimal placeholder for the Results screen so Screen 7 (Voting) has
// somewhere real to navigate to once every player has voted -- results
// computation/reveal is a separate task, not implemented here.
export default function ResultsPlaceholder() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-iw-void px-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <p className="font-display text-2xl font-semibold text-iw-ink-100">
          Results
        </p>
        <p className="text-sm text-iw-ink-500">
          This screen hasn&apos;t been built yet. Coming in a future update.
        </p>
        <Link
          href="/voting"
          className="mt-2 inline-flex items-center gap-2 rounded-full border border-iw-border bg-iw-surface/70 px-4 py-2 text-sm font-semibold text-iw-ink-100 transition-colors hover:border-iw-border-strong hover:bg-iw-surface-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Voting
        </Link>
      </div>
    </div>
  );
}
