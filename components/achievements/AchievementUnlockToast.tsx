"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { UnlockedAchievementEvent } from "@/lib/achievements/store";
import { playSound } from "@/shared/lib/sound-engine";
import { success } from "@/shared/lib/haptics";

const AUTO_DISMISS_MS = 3600;

/**
 * The unlock notification (spec sections 10-11). A single game can
 * unlock several achievements at once (e.g. a first-ever 12-player,
 * 3-imposter win unlocking First Game + Full House + Triple Threat +
 * First Betrayal all together) -- rather than stacking multiple large
 * modals, this renders one compact, dismissible toast at a time and
 * auto-advances through the rest of `events` on a short timer (spec's
 * "Achievement 1 -> Achievement 2 -> Achievement 3" queue option, the
 * simplest implementation that still avoids overlapping alerts).
 *
 * Fixed to the top of the viewport so it never covers the Final
 * Results screen's win/word/imposter reveal underneath, and uses the
 * same `animate-iw-fade-in` class every other screen does -- which
 * already resolves to no animation under `prefers-reduced-motion`
 * (see app/globals.css).
 */
export default function AchievementUnlockToast({
  events,
}: {
  events: UnlockedAchievementEvent[];
}) {
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const playedRef = useRef(false);

  // Fire the unlock sound/haptic exactly once per game, the moment
  // there's something to show -- never once per queued item, so a
  // multi-unlock game doesn't sound like a slot machine.
  useEffect(() => {
    if (events.length === 0 || playedRef.current) return;
    playedRef.current = true;
    playSound("ui-confirm");
    success();
  }, [events.length]);

  useEffect(() => {
    if (events.length === 0 || dismissed) return;
    const timer = window.setTimeout(() => {
      setIndex((current) =>
        current < events.length - 1 ? current + 1 : current,
      );
      if (index >= events.length - 1) setDismissed(true);
    }, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [index, events.length, dismissed]);

  if (events.length === 0 || dismissed) return null;

  const current = events[index];
  const Icon = current.achievement.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-safe pl-safe pr-safe sm:pt-6"
    >
      <div className="animate-iw-fade-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-iw-gold-600/40 bg-iw-void/95 px-4 py-3 shadow-[0_16px_32px_-14px_rgba(255,184,0,0.5)] backdrop-blur-sm">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 text-iw-gold-ink"
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wide text-iw-gold-500">
            🏆 {current.displayName} unlocked an achievement
          </span>
          <span className="truncate font-display text-sm font-bold text-iw-ink-100">
            {current.achievement.title}
          </span>
          {events.length > 1 && (
            <span className="text-xs text-iw-ink-500">
              {index + 1} of {events.length}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss achievement notification"
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-iw-ink-500 transition-colors hover:bg-iw-surface-2 hover:text-iw-ink-100"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
