import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Same card treatment as how-to-play/SectionCard.tsx and
 * settings/AboutCard.tsx (rounded-3xl border, translucent surface,
 * animate-iw-fade-up entrance), reused here so the Privacy screen matches
 * the rest of the app instead of looking like a bare legal-text dump.
 */
export default function PrivacySectionCard({
  icon: Icon,
  title,
  delayMs = 0,
  children,
}: {
  icon: LucideIcon;
  title: string;
  delayMs?: number;
  children: ReactNode;
}) {
  return (
    <section
      className="animate-iw-fade-up rounded-3xl border border-iw-border bg-iw-surface/40 p-4 backdrop-blur-sm sm:p-5"
      style={{ animationDelay: `${delayMs}ms` }}
      aria-labelledby={`privacy-${slugify(title)}`}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-iw-surface-2/60 text-iw-violet-300"
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <h2
          id={`privacy-${slugify(title)}`}
          className="min-w-0 flex-1 pt-2 font-display text-lg font-semibold tracking-wide text-iw-ink-100 sm:text-xl"
        >
          {title}
        </h2>
      </div>

      <div className="mt-4 space-y-3 text-sm leading-relaxed text-iw-ink-300">
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