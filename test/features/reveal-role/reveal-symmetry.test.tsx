import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ImposterRevealCard, PlayerRevealCard } from "@/features/reveal-role";

// Anti-tell guard (see the header comment in features/reveal-role/index.ts):
// the crew card and the imposter card must enable "HIDE & PASS PHONE" at
// exactly the same moment, or the button's timing leaks who the imposter
// is to anyone watching the phone.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// Long enough that both cards must have enabled their button by then.
const SETTLED_MS = 10_000;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

function hideButton(): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find((b) =>
    /hide/i.test(b.textContent ?? ""),
  );
  if (!button) throw new Error("HIDE & PASS PHONE button not found");
  return button;
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** Renders `card` and returns the ms (at 1 ms resolution) at which its button enables. */
function msUntilHideEnabled(card: ReactElement): number {
  act(() => root.render(card));
  expect(hideButton().disabled).toBe(true);
  for (let elapsed = 1; elapsed <= SETTLED_MS; elapsed++) {
    advance(1);
    if (!hideButton().disabled) return elapsed;
  }
  throw new Error("HIDE & PASS PHONE button never enabled");
}

describe("reveal-role anti-tell symmetry", () => {
  it("crew and imposter cards enable the hide button at the same moment", () => {
    const crew = msUntilHideEnabled(
      <PlayerRevealCard playerName="Ahmed" word="Pizza" onHide={() => {}} />,
    );

    act(() => root.unmount());
    root = createRoot(container);

    const imposter = msUntilHideEnabled(
      <ImposterRevealCard
        playerName="Asmed"
        hint="Something you eat"
        onHide={() => {}}
      />,
    );

    expect(crew).toBe(imposter);
  });

  it("the imposter card never renders the secret word", () => {
    act(() =>
      root.render(
        <ImposterRevealCard
          playerName="Mali"
          hint="Something you eat"
          onHide={() => {}}
        />,
      ),
    );
    advance(SETTLED_MS);
    expect(container.textContent).not.toMatch(/secret word:/i);
    expect(container.textContent).toContain("You don't know the secret word.");
  });
});
