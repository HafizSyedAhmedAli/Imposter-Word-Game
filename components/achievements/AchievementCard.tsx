import { Lock } from "lucide-react";
import type { AchievementState } from "@/lib/achievements/engine";

/**
 * One achievement's card -- unlocked, locked-with-progress, or
 * locked-binary (spec section 8's mock: a checkmark + "Unlocked" for
 * earned achievements, a lock icon + progress bar/plain "Locked" for
 * the rest). `unlockedAt`, when known, is shown as a small earned-date
 * caption; its absence never implies "locked" -- see
 * lib/achievements/store.ts's doc comment on why unlock *state* always
 * comes from `state.unlocked`, never from whether a timestamp exists.
 */
export default function AchievementCard({
  state,
  unlockedAt,
}: {
  state: AchievementState;
  unlockedAt?: number;
}) {
  const { definition, unlocked, progress } = state;
  const Icon = definition.icon;

  return (
    <li
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 transition-colors ${
        unlocked
          ? "border-iw-gold-600/40 bg-iw-gold-500/10"
          : "border-iw-border bg-iw-surface/60"
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          unlocked
            ? "bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 text-iw-gold-ink shadow-[0_6px_14px_-4px_rgba(255,184,0,0.55)]"
            : "bg-iw-surface-2 text-iw-ink-500"
        }`}
      >
        {unlocked ? (
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        ) : (
          <Lock className="h-5 w-5" strokeWidth={2.25} />
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-display text-base font-semibold text-iw-ink-100">
            {definition.title}
          </span>
          {unlocked && (
            <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-iw-gold-500">
              Unlocked
            </span>
          )}
        </div>

        <p className="text-sm text-iw-ink-500">{definition.description}</p>

        {unlocked ? (
          unlockedAt ? (
            <p className="text-xs text-iw-ink-500">
              Unlocked {new Date(unlockedAt).toLocaleDateString()}
            </p>
          ) : null
        ) : definition.binary ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
            Locked
          </span>
        ) : (
          <div className="mt-1 flex flex-col gap-1">
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-iw-surface-2"
              role="progressbar"
              aria-valuenow={progress.current}
              aria-valuemin={0}
              aria-valuemax={progress.target}
              aria-label={`${definition.title} progress`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-iw-violet-500 to-iw-violet-600"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((progress.current / progress.target) * 100),
                  )}%`,
                }}
              />
            </div>
            <span className="text-xs font-semibold text-iw-ink-500">
              {progress.current} / {progress.target}
            </span>
          </div>
        )}
      </div>
    </li>
  );
}
