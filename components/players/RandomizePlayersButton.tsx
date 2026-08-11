import { Shuffle } from "lucide-react";

export default function RandomizePlayersButton({
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
      aria-label="Randomize player order"
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-iw-border bg-iw-surface/60 px-3 py-1.5 text-xs font-semibold text-iw-violet-300 transition-all duration-150 hover:-translate-y-0.5 hover:border-iw-border-strong hover:bg-iw-surface-2 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
    >
      <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
      Randomize
    </button>
  );
}
