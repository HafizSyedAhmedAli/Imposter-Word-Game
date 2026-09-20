"use client";

import { useEffect, useRef } from "react";

/**
 * A true modal dialog: focus moves in, Tab is trapped inside it, the rest
 * of the page becomes inert, and focus is restored to whatever triggered
 * it on close. This is built on the native <dialog> element specifically
 * because showModal() gives all of that for free per the HTML spec (no
 * focus-trap library needed) -- see
 * https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal.
 *
 * The parent (PassPhoneScreen) mounts this component only while
 * `confirmingLeave` is true, so "mounted" and "open" are the same state --
 * showModal() is called on mount and there's no separate open/closed prop.
 */
export default function LeaveRoundDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // The element focused right before the dialog opened (the header's
    // back button, or whatever triggered a browser back navigation) --
    // restored explicitly on close as a belt-and-suspenders measure,
    // since not all browsers restore it themselves.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    dialog.showModal();
    // Default to the non-destructive action so a keyboard user who
    // presses Enter immediately doesn't accidentally leave the round.
    stayButtonRef.current?.focus();

    // showModal() already prevents Tab from reaching anything behind the
    // dialog and makes the rest of the page inert to pointer/AT
    // interaction -- this only needs to redirect what Escape does, since
    // native <dialog> fires "cancel" (then "close") on Escape and we want
    // that routed through the same onCancel the "STAY HERE" button uses,
    // rather than letting the dialog close out from under React state.
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
      aria-labelledby="leave-round-heading"
      aria-describedby="leave-round-description"
      className="m-0 max-w-none border-0 bg-transparent p-0 backdrop:bg-iw-void/70 backdrop:backdrop-blur-sm"
    >
      <div className="fixed inset-0 flex items-center justify-center px-6">
        <div className="animate-iw-fade-up w-full max-w-sm rounded-3xl border border-iw-border bg-iw-surface p-6 text-center">
          <h2
            id="leave-round-heading"
            className="font-display text-lg font-bold text-iw-ink-100"
          >
            Leave this round?
          </h2>
          <p
            id="leave-round-description"
            className="mt-2 text-sm text-iw-ink-500"
          >
            Your current round will be lost, and no one will get to see their
            word or role.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <button
              ref={stayButtonRef}
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
    </dialog>
  );
}
