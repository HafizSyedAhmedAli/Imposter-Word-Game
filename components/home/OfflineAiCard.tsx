import { WifiOff, Sparkles } from "lucide-react";

export default function OfflineAiCard() {
  return (
    <div className="flex flex-col divide-y divide-iw-border overflow-hidden rounded-2xl border border-iw-border bg-iw-surface/50 backdrop-blur-sm sm:flex-row sm:divide-x sm:divide-y-0">
      <div className="flex flex-1 items-start gap-3 p-4">
        <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" strokeWidth={2.25} aria-hidden="true" />
        <div>
          <p className="font-display text-sm font-semibold tracking-wide text-sky-300">
            Offline Mode
          </p>
          <p className="mt-1 text-xs leading-snug text-iw-ink-500">
            Play anytime! The game works perfectly without internet.
          </p>
        </div>
      </div>
      <div className="flex flex-1 items-start gap-3 p-4">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-iw-violet-300" strokeWidth={2.25} aria-hidden="true" />
        <div>
          <p className="font-display text-sm font-semibold tracking-wide text-iw-violet-300">
            AI Powered
          </p>
          <p className="mt-1 text-xs leading-snug text-iw-ink-500">
            AI generated words &amp; hints. 
          </p>
        </div>
      </div>
    </div>
  );
}
