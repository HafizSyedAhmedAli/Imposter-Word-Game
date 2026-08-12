// components/game/DiscussionTimer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { TimerReset } from "lucide-react";

/**
 * Self-contained countdown. DiscussionScreen passes in a duration (in
 * seconds, from the round's own config) or `null` when no discussion
 * timer was configured -- all running/remaining/expired state lives
 * here, so a future shared/synced round-timer can be swapped in later
 * just by changing what feeds `durationSeconds`, without touching
 * DiscussionScreen itself (spec section 12).
 *
 * Never renders anything derived from the round's word, hint, or roles.
 */
export default function DiscussionTimer({
  durationSeconds,
  onExpire,
}: {
  durationSeconds: number | null;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(durationSeconds ?? 0);
  // Guards against calling onExpire more than once if the "remaining
  // reaches 0" effect below re-runs for any reason.
  const expiredRef = useRef(false);

  // Ticks the countdown down. This effect ONLY updates this component's
  // own `remaining` state -- it never calls `onExpire` (a different
  // component's setState) directly from inside a setState updater,
  // since that runs during React's render/commit work and isn't a safe
  // place to update another component (see the effect below instead).
  useEffect(() => {
    if (durationSeconds === null) return;

    setRemaining(durationSeconds);
    expiredRef.current = false;

    const interval = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [durationSeconds]);

  // Reports expiry back up to DiscussionScreen. Runs as its own effect
  // (a safe point to update a different component's state) once
  // `remaining` actually reaches 0, rather than from inside the ticking
  // interval above.
  useEffect(() => {
    if (durationSeconds === null) return;
    if (remaining === 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire();
    }
    // `onExpire` is intentionally omitted -- DiscussionScreen passes a
    // fresh inline function each render, and this should only re-run
    // when `remaining` actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, durationSeconds]);

  if (durationSeconds === null) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-iw-border bg-iw-surface/60 px-5 py-4 backdrop-blur-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-iw-violet-500/15 text-iw-violet-300">
          <TimerReset className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
            Discussion
          </p>
          <p className="font-display text-lg font-bold text-iw-ink-100">
            No timer — discuss freely
          </p>
        </div>
      </div>
    );
  }

  const expired = remaining <= 0;
  const minutes = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");
  const progress = durationSeconds > 0 ? remaining / durationSeconds : 0;

  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-3xl border p-5 text-center backdrop-blur-sm transition-colors ${
        expired
          ? "border-iw-red/40 bg-iw-red/10"
          : "border-iw-border bg-iw-surface/60"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
        {expired ? "Time's up" : "Discussion time"}
      </p>

      <p
        role="timer"
        aria-live="polite"
        aria-label={
          expired
            ? "Discussion time is up"
            : `${minutes} minutes ${seconds} seconds remaining`
        }
        className={`font-display text-5xl font-bold tabular-nums ${
          expired ? "text-iw-red" : "text-iw-ink-100"
        }`}
      >
        {minutes}:{seconds}
      </p>

      <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-iw-surface-2">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
            expired
              ? "bg-iw-red"
              : "bg-gradient-to-r from-iw-gold-400 to-iw-gold-500"
          }`}
          style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
        />
      </div>
    </div>
  );
}
