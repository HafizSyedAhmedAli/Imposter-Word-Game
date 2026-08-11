import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Temporary placeholder for Screen 5 (private pass-the-phone role
// reveal), so Screen 4 has somewhere real to navigate to once a round is
// ready. Role reveal itself is a separate task -- not implemented here.
export default function PassPlaceholder() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-iw-void px-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <p className="font-display text-2xl font-semibold text-iw-ink-100">
          Pass the Phone
        </p>
        <p className="text-sm text-iw-ink-500">
          This screen hasn&apos;t been built yet. Coming in a future update.
        </p>
        <Link
          href="/round"
          className="mt-2 inline-flex items-center gap-2 rounded-full border border-iw-border bg-iw-surface/70 px-4 py-2 text-sm font-semibold text-iw-ink-100 transition-colors hover:border-iw-border-strong hover:bg-iw-surface-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Round
        </Link>
      </div>
    </div>
  );
}
