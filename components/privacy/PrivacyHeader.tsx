"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import ConnectionStatus from "@/components/home/ConnectionStatus";
import { playSound } from "@/lib/sound-engine";

/**
 * Same shell as HowToPlayHeader/SettingsHeader: back arrow left, centered
 * icon/title/subtitle, live connection indicator right. Privacy is a
 * standalone screen reachable from Settings (and directly via /privacy for
 * Play Console's privacy policy link), not part of an in-progress round.
 */
export default function PrivacyHeader() {
  return (
    <header className="flex items-start justify-between gap-3">
      <Link
        href="/"
        aria-label="Go back"
        onClick={() => playSound("ui-tap")}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-iw-border bg-iw-surface/60 text-iw-ink-100 backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-iw-border-strong hover:bg-iw-surface-2 active:translate-y-0 active:scale-95"
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
      </Link>

      <div className="flex flex-1 flex-col items-center px-1 text-center">
        <span
          className="flex h-7 w-7 items-center justify-center text-iw-violet-300 sm:h-8 sm:w-8"
          aria-hidden="true"
        >
          <ShieldCheck className="h-6 w-6" strokeWidth={2} />
        </span>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-iw-ink-100 sm:text-4xl">
          PRIVACY POLICY
        </h1>
        <p className="mt-1 max-w-[22rem] text-sm text-iw-violet-300 sm:text-base">
          What we collect, what stays on your device, and why.
        </p>
      </div>

      <div className="shrink-0">
        <ConnectionStatus />
      </div>
    </header>
  );
}
