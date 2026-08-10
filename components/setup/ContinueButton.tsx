import { ArrowRight } from "lucide-react";

export default function ContinueButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative flex w-full items-center justify-center gap-3 rounded-[1.75rem] border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 text-center shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 ease-out animate-iw-glow-pulse hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
    >
      <span className="font-display text-xl font-bold tracking-wide text-iw-gold-ink sm:text-2xl">
        CONTINUE
      </span>
      <ArrowRight
        className="h-6 w-6 text-iw-gold-ink transition-transform duration-150 group-hover:translate-x-1"
        aria-hidden="true"
      />
    </button>
  );
}
