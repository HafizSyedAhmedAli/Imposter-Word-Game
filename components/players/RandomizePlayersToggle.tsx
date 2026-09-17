// components/players/RandomizePlayersToggle.tsx
"use client";

/**
 * Same structure as CategorySelector's Custom Words toggle
 * (components/setup/CategorySelector.tsx): a full-width row button,
 * label + description on the left, switch on the right. Track/knob
 * classes are copied verbatim from there.
 *
 * Flipping this off -> on rotates the player list once (see
 * lib/shuffle.ts's `rotate`); flipping it on -> off is just a UI state
 * change and leaves the current order untouched.
 */
export default function RandomizePlayersToggle({
  enabled,
  onToggle,
  disabled,
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`Randomize player order, ${enabled ? "on" : "off"}`}
      onClick={onToggle}
      disabled={disabled}
      className="mt-4 flex items-center w-full justify-between gap-3 rounded-2xl border border-iw-border bg-iw-surface/60 px-4 py-3 text-left transition-colors duration-150 hover:border-iw-border-strong cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span>
        <span className="block text-sm font-semibold text-iw-ink-100">
          Randomize Order
        </span>
        <span className="block text-xs text-iw-ink-500">
          Shuffle who goes first
        </span>
      </span>
      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-150 ${
          enabled
            ? "border-iw-violet-400/60 bg-iw-violet-500"
            : "border-iw-border bg-iw-surface-2"
        }`}
      >
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-md transition-transform duration-150 ${
            enabled ? "translate-x-[22px]" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}
