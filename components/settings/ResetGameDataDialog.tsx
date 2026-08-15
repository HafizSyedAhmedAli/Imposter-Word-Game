"use client";

import { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";

const WILL_DELETE = [
  "AI-generated rounds",
  "Custom words",
  "Game history",
  "Statistics",
  "Saved preferences",
];

/**
 * A true modal dialog for the destructive "Reset Game Data" action.
 * Structurally identical to components/pass/LeaveRoundDialog.tsx (native
 * <dialog> + showModal() for a free focus trap, Escape routed through
 * onCancel, focus restored on close) -- see that file's doc comment for
 * why this pattern is used instead of a library. Deliberately mounted
 * only while open, same as LeaveRoundDialog, so "mounted" and "open"
 * stay the same state.
 */
export default function ResetGameDataDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    dialog.showModal();
    // Default focus on Cancel (the non-destructive action) so a keyboard
    // user pressing Enter immediately doesn't wipe their data by accident.
    cancelButtonRef.current?.focus();

    function handleCancel(event: Event) {
      event.preventDefault();
      onCancel();
    }
    dialog.addEventListener("cancel", handleCancel);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.close();
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="reset-data-heading"
      aria-describedby="reset-data-description"
      className="m-0 max-w-none border-0 bg-transparent p-0 backdrop:bg-iw-void/70 backdrop:backdrop-blur-sm"
    >
      <div className="fixed inset-0 flex items-center justify-center px-6">
        <div className="animate-iw-fade-up w-full max-w-sm rounded-3xl border border-iw-red/40 bg-iw-surface p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-iw-red/40 bg-iw-red/10 text-iw-red">
            <Trash2 className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </div>

          <h2
            id="reset-data-heading"
            className="mt-3 font-display text-lg font-bold text-iw-ink-100"
          >
            Reset game data?
          </h2>
          <p
            id="reset-data-description"
            className="mt-2 text-sm text-iw-ink-500"
          >
            This will permanently delete your locally saved:
          </p>

          <ul className="mt-3 flex flex-col gap-1.5 text-left">
            {WILL_DELETE.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-iw-ink-300"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-iw-red"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-3">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onCancel}
              className="w-full cursor-pointer rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-3 font-display text-sm font-bold text-iw-gold-ink"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="w-full cursor-pointer rounded-2xl border border-iw-red/40 bg-iw-red/10 px-6 py-3 font-display text-sm font-bold text-iw-red transition-colors hover:bg-iw-red/20"
            >
              RESET DATA
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
