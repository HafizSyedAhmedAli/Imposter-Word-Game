import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  getRecoverableActiveGame,
  getStoredRoundSession,
  markActiveGameRoute,
  storeRoundSession,
} from "@/entities/round";
import { GameRecoveryPrompt } from "@/features/recover-active-game";
import { baseSession } from "../../helpers/fixtures";

// Guard for the pass-the-phone recovery rule (see the header comment in
// features/recover-active-game/index.ts): a relaunched game must NEVER
// resume on its own -- only a deliberate "RESUME GAME" tap restores the
// round, and Escape must not act as a hidden third choice.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

// jsdom doesn't implement <dialog>'s modal API.
beforeEach(() => {
  const proto = HTMLDialogElement.prototype as Partial<HTMLDialogElement>;
  proto.showModal = vi.fn();
  proto.close = vi.fn();
  push.mockClear();
});

let container: HTMLDivElement;
let root: Root;

function mount() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<GameRecoveryPrompt />));
}

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function button(label: RegExp): HTMLButtonElement {
  const found = Array.from(container.querySelectorAll("button")).find((b) =>
    label.test(b.textContent ?? ""),
  );
  if (!found) throw new Error(`button ${label} not found`);
  return found;
}

/** A game that survived a full app close: localStorage mirror only. */
function saveGameThenSimulateFullClose(route: "/pass" | "/voting" = "/voting") {
  const session = baseSession({ status: "playing" });
  storeRoundSession(session);
  markActiveGameRoute(route);
  sessionStorage.clear(); // a real relaunch loses sessionStorage
  return session;
}

describe("GameRecoveryPrompt", () => {
  it("renders nothing when there is no unfinished game", () => {
    mount();
    expect(container.querySelector("dialog")).toBeNull();
  });

  it("renders nothing when the tab still has its live round (nothing was lost)", () => {
    storeRoundSession(baseSession({ status: "playing" }));
    mount();
    expect(container.querySelector("dialog")).toBeNull();
  });

  it("never auto-resumes: mounting only asks, it restores and navigates nothing", () => {
    saveGameThenSimulateFullClose();
    mount();

    expect(container.querySelector("dialog")).not.toBeNull();
    expect(container.textContent).toContain("Game in Progress");
    expect(push).not.toHaveBeenCalled();
    expect(getStoredRoundSession()).toBeNull();
  });

  it("Escape is a no-op: the cancel event is default-prevented", () => {
    saveGameThenSimulateFullClose();
    mount();

    const cancel = new Event("cancel", { cancelable: true });
    container.querySelector("dialog")!.dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(push).not.toHaveBeenCalled();
    expect(getStoredRoundSession()).toBeNull();
  });

  it("RESUME GAME restores the exact saved session and returns to the saved screen", () => {
    const session = saveGameThenSimulateFullClose("/voting");
    mount();

    act(() => button(/resume game/i).click());

    expect(getStoredRoundSession()).toEqual(session);
    expect(push).toHaveBeenCalledWith("/voting");
  });

  it("START NEW GAME discards only the recovery record and closes the prompt", () => {
    saveGameThenSimulateFullClose();
    mount();

    act(() => button(/start new game/i).click());

    expect(getRecoverableActiveGame()).toBeNull();
    expect(getStoredRoundSession()).toBeNull();
    expect(push).not.toHaveBeenCalled();
    expect(container.querySelector("dialog")).toBeNull();
  });
});
