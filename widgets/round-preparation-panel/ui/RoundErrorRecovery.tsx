import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";

/**
 * Shown when preparation genuinely cannot proceed -- either there's no
 * valid player setup to work from (see Screen 4 spec, section 36), or
 * both the AI provider and the local collection failed (section 28/66).
 * Never surfaces a technical error message, only a friendly one.
 */
export default function RoundErrorRecovery({
  title,
  message,
  onRetry,
  onBack,
  backLabel = "BACK TO PLAYERS",
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  onBack: () => void;
  backLabel?: string;
}) {
  return (
    <div className="animate-iw-fade-up flex flex-col items-center gap-5 rounded-3xl border border-iw-border bg-iw-surface/40 p-6 text-center backdrop-blur-sm sm:p-8">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-iw-offline/15 text-iw-offline">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </span>

      <div>
        <h2 className="font-display text-xl font-bold text-iw-ink-100 sm:text-2xl">
          {title}
        </h2>
        <p className="mt-2 max-w-xs text-sm text-iw-ink-500 sm:text-base">
          {message}
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-3 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            TRY AGAIN
          </button>
        )}
        <button
          type="button"
          onClick={onBack}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-iw-border bg-iw-surface/70 px-6 py-3 font-display text-base font-bold text-iw-ink-100 transition-colors hover:border-iw-border-strong hover:bg-iw-surface-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </button>
      </div>
    </div>
  );
}
