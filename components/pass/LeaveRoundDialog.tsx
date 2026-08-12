export default function LeaveRoundDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-iw-void/70 px-6 backdrop-blur-sm">
      <div className="animate-iw-fade-up w-full max-w-sm rounded-3xl border border-iw-border bg-iw-surface p-6 text-center">
        <h2 className="font-display text-lg font-bold text-iw-ink-100">
          Leave this round?
        </h2>
        <p className="mt-2 text-sm text-iw-ink-500">
          Your current round will be lost, and no one will get to see their word
          or role.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full cursor-pointer rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-3 font-display text-sm font-bold text-iw-gold-ink"
          >
            STAY HERE
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full cursor-pointer rounded-2xl border border-iw-border bg-iw-surface-2 px-6 py-3 font-display text-sm font-bold text-iw-ink-100 transition-colors hover:border-iw-border-strong"
          >
            LEAVE ROUND
          </button>
        </div>
      </div>
    </div>
  );
}
