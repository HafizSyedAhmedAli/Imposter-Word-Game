import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared chrome for every How to Play section -- same card treatment as
 * components/settings/AboutCard.tsx and PreferencesCard.tsx (rounded-3xl
 * border, translucent surface, `animate-iw-fade-up` entrance). Centralizing
 * it here means every section in this screen looks and animates
 * identically without copy-pasting the wrapper markup into 10+ files.
 *
 * `delayMs` staggers each section's entrance slightly after the one
 * before it, same pattern as AboutCard's `animationDelay: "60ms"`.
 */
export default function SectionCard({
  icon: Icon,
  iconClassName = "text-iw-violet-300",
  title,
  subtitle,
  delayMs = 0,
  children,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  subtitle?: string;
  delayMs?: number;
  children: ReactNode;
}) {
  return (
    <section
      className="animate-iw-fade-up rounded-3xl border border-iw-border bg-iw-surface/40 p-4 backdrop-blur-sm sm:p-5"
      style={{ animationDelay: `${delayMs}ms` }}
      aria-labelledby={`htp-${slugify(title)}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-iw-surface-2/60 ${iconClassName}`}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id={`htp-${slugify(title)}`}
            className="font-display text-lg font-semibold tracking-wide text-iw-ink-100 sm:text-xl"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-iw-ink-500">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="mt-4 text-sm leading-relaxed text-iw-ink-300">
        {children}
      </div>
    </section>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
