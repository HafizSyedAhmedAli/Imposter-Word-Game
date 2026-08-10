import { ChevronDown, type LucideIcon } from "lucide-react";
import type { TimerSettings } from "@/game/game-types";

export default function TimerOption({
  icon: Icon,
  title,
  description,
  value,
  options,
  onChange,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  value: TimerSettings;
  options: readonly number[];
  onChange: (patch: Partial<TimerSettings>) => void;
}) {
  const inputId = `timer-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-iw-border bg-iw-surface/60 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-iw-violet-500/20 text-iw-violet-300">
          <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-sm font-semibold tracking-wide text-iw-ink-100 sm:text-base">
            {title}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-iw-ink-500 sm:text-sm">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
        <div
          role="group"
          aria-label={`${title} on or off`}
          className="flex shrink-0 overflow-hidden rounded-full border border-iw-border bg-iw-surface-2 p-0.5"
        >
          <button
            type="button"
            aria-pressed={!value.enabled}
            onClick={() => onChange({ enabled: false })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              !value.enabled
                ? "bg-iw-surface text-iw-ink-100"
                : "text-iw-ink-500"
            }`}
          >
            OFF
          </button>
          <button
            type="button"
            aria-pressed={value.enabled}
            onClick={() => onChange({ enabled: true })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              value.enabled
                ? "bg-iw-violet-500 text-white shadow-[0_2px_8px_-1px_rgba(139,92,246,0.6)]"
                : "text-iw-ink-500"
            }`}
          >
            ON
          </button>
        </div>

        <div className="relative shrink-0">
          <label htmlFor={inputId} className="sr-only">
            {title} duration
          </label>
          <select
            id={inputId}
            value={value.duration}
            disabled={!value.enabled}
            onChange={(e) => onChange({ duration: Number(e.target.value) })}
            className={`appearance-none rounded-full border border-iw-border bg-iw-surface-2 py-1.5 pl-3 pr-7 text-xs font-semibold outline-none transition-opacity ${
              value.enabled
                ? "text-iw-ink-100"
                : "cursor-not-allowed text-iw-ink-600 opacity-50"
            }`}
          >
            {options.map((secs) => (
              <option
                key={secs}
                value={secs}
                className="bg-iw-nebula-2 text-iw-ink-100"
              >
                {secs}s
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-iw-ink-500"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
