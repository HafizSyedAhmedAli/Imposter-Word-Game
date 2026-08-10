import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

export default function HomeMenuItem({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-iw-border bg-iw-surface/70 px-4 py-3.5 backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-iw-border-strong hover:bg-iw-surface-2 active:translate-y-0 active:scale-[0.98]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-iw-violet-500 to-iw-violet-600 text-iw-ink-100 shadow-[0_6px_14px_-4px_rgba(139,92,246,0.6)]">
        <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-display text-base font-semibold tracking-wide text-iw-ink-100">
          {title}
        </span>
        <span className="truncate text-sm text-iw-ink-500">{subtitle}</span>
      </span>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-iw-ink-500 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-iw-violet-300"
        aria-hidden="true"
      />
    </Link>
  );
}
