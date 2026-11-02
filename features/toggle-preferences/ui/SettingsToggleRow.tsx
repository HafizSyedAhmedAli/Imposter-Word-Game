"use client";

import type { LucideIcon } from "lucide-react";

/**
 * A full-row toggle switch, styled to match ResetGameDataCard's button
 * row (same border/hover/active treatment) so Settings reads as one
 * consistent list rather than mixed control styles. The entire row is
 * the hit target -- not just the small switch glyph -- to comfortably
 * clear the ~44px touch-target guidance on mobile.
 */
export default function SettingsToggleRow({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
  disabled = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`${title}, ${enabled ? "on" : "off"}`}
      disabled={disabled}
      onClick={onToggle}
      className="flex w-full items-center gap-4 rounded-2xl border border-iw-border bg-iw-surface/60 px-4 py-3.5 text-left backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-iw-border-strong hover:bg-iw-surface-2 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-iw-violet-500/20 text-iw-violet-300">
        <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-display text-base font-semibold tracking-wide text-iw-ink-100">
          {title}
        </span>
        <span className="truncate text-sm text-iw-ink-500">{description}</span>
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
