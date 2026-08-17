import { Info } from "lucide-react";

// Injected at build time from package.json (see next.config.ts) so this
// never hardcodes a version number that could drift from the real one.
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

export default function AboutCard() {
  return (
    <section
      className="rounded-3xl border border-iw-border bg-iw-surface/40 p-4 backdrop-blur-sm animate-iw-fade-up sm:p-5"
      style={{ animationDelay: "60ms" }}
    >
      <h2 className="font-display text-lg font-semibold tracking-wide text-iw-ink-100 sm:text-xl">
        ABOUT
      </h2>

      <div className="mt-3 flex items-center gap-4 rounded-2xl border border-iw-border bg-iw-surface-2/60 px-4 py-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-iw-violet-500/15 text-iw-violet-300">
          <Info className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-display text-base font-semibold tracking-wide text-iw-ink-100">
            IMPOSTER WORD
          </span>
          <span className="text-sm text-iw-ink-500">
            {APP_VERSION ? `Version ${APP_VERSION}` : "Version unavailable"}
            {" \u00b7 "}AI-powered when online. Playable offline.
          </span>
        </span>
      </div>
    </section>
  );
}
