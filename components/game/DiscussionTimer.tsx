// components/game/DiscussionTimer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { TimerReset } from "lucide-react";
import { playSound, stopSound } from "@/lib/sound-engine";

const TICK_WINDOW_SECONDS = 10;

export default function DiscussionTimer({
  durationSeconds,
  onExpire,
}: {
  durationSeconds: number | null;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(durationSeconds ?? 0);
  const expiredRef = useRef(false);
  const tickIdRef = useRef<number | null>(null);
  const tickStartedRef = useRef(false);
  const resettingRef = useRef(false); // 1. Add resetting flag

  // Effect 1: Handle duration resets and main interval loop
  useEffect(() => {
    if (durationSeconds === null) return;

    resettingRef.current = true; // Mark reset in progress
    setRemaining(durationSeconds);
    expiredRef.current = false;
    tickStartedRef.current = false;

    const interval = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
      stopSound("timer-tick", tickIdRef.current);
      tickIdRef.current = null;
    };
  }, [durationSeconds]);

  // Effect 2: Handle sound effects and expiration trigger
  useEffect(() => {
    if (durationSeconds === null) return;

    // Gate execution until state update catches up with duration reset
    if (resettingRef.current) {
      if (remaining !== durationSeconds) return;
      resettingRef.current = false;
    }

    // Fire tick sound during final 10-second countdown
    if (
      remaining > 0 &&
      remaining <= TICK_WINDOW_SECONDS &&
      !tickStartedRef.current
    ) {
      tickStartedRef.current = true;
      tickIdRef.current = playSound("timer-tick");
    }

    // Trigger completion
    if (remaining === 0 && !expiredRef.current) {
      expiredRef.current = true;
      stopSound("timer-tick", tickIdRef.current);
      tickIdRef.current = null;
      playSound("timer-end");
      onExpire();
    }
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
