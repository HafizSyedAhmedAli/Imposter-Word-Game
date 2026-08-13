// components/vote/VotingTimer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";

/**
 * Same self-contained countdown pattern as
 * components/game/DiscussionTimer.tsx, kept as its own component (not a
 * reused/relabeled import) so Screen 6 stays untouched -- per the spec's
 * implementation principle, this task only adds Screen 7, it doesn't
 * modify Screens 1-6 (see spec's "Do Not Do These Things").
 *
 * Mounted once for the whole voting phase in VoteScreen and never
 * remounted as the phone moves between voters, so its internal
 * `remaining` state is never reset when one voter's turn ends and the
 * next begins (spec section 49-50) -- only VoteScreen swapping
 * `durationSeconds` itself (i.e. a different round) restarts it.
 */
export default function VotingTimer({
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

  useEffect(() => {
    if (durationSeconds === null) return;

    setRemaining(durationSeconds);
    expiredRef.current = false;

    const interval = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [durationSeconds]);

  useEffect(() => {
    if (durationSeconds === null) return;
    if (remaining === 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire();
    }
    // `onExpire` intentionally omitted -- VoteScreen passes a fresh
    // inline function each render, and this should only re-run when
    // `remaining` actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, durationSeconds]);

  if (durationSeconds === null) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-iw-border bg-iw-surface/60 px-5 py-4 backdrop-blur-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-iw-violet-500/15 text-iw-violet-300">
          <Timer className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
            Voting
          </p>
          <p className="font-display text-lg font-bold text-iw-ink-100">
            No timer — vote when ready
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
        {expired ? "Time's up" : "Voting time"}
      </p>

      <p
        role="timer"
        aria-live="polite"
        aria-label={
          expired
            ? "Voting time is up"
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
