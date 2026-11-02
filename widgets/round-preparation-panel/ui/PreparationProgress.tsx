const TOTAL_STEPS = 4;

export default function PreparationProgress({ step }: { step: number }) {
  const percent = Math.min(100, Math.round((step / TOTAL_STEPS) * 100));

  return (
    <div className="w-full max-w-xs">
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-iw-surface-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-iw-violet-500 to-iw-violet-400 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-center text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
        Step {Math.min(step, TOTAL_STEPS)} of {TOTAL_STEPS}
      </p>
    </div>
  );
}
