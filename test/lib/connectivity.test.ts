import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * lib/connectivity.ts backs useOnlineStatus's useSyncExternalStore call
 * and had zero direct test coverage. Mocks Capacitor.isNativePlatform
 * as unavailable/false so the web (`window.addEventListener("online"/
 * "offline")`) path is exercised -- the Capacitor Network plugin path
 * (startNative) needs a real native runtime and isn't reachable in
 * jsdom.
 *
 * `start()` and its module-level `started`/`cachedOnline` state are
 * only initialized once per module instance, so `vi.resetModules()` +
 * a fresh dynamic import gives each test a clean slate rather than
 * silently reusing whatever the previous test left behind.
 */

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => false },
}));

afterEach(() => {
  vi.resetModules();
});

describe("getConnectivityServerSnapshot", () => {
  it("always reports online -- this is a cosmetic indicator, never a functionality gate", async () => {
    const { getConnectivityServerSnapshot: serverSnapshot } = await import(
      "@/shared/lib/connectivity"
    );
    expect(serverSnapshot()).toBe(true);
  });
});

describe("getConnectivitySnapshot / subscribeConnectivity", () => {
  it("reflects navigator.onLine as its initial snapshot", async () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);
    const { getConnectivitySnapshot: snapshot } = await import(
      "@/shared/lib/connectivity"
    );
    expect(snapshot()).toBe(true);
  });

  it("notifies subscribers when the browser fires an 'offline' event", async () => {
    const {
      subscribeConnectivity: subscribe,
      getConnectivitySnapshot: snapshot,
    } = await import("@/shared/lib/connectivity");

    const listener = vi.fn();
    subscribe(listener);

    window.dispatchEvent(new Event("offline"));

    expect(snapshot()).toBe(false);
    expect(listener).toHaveBeenCalled();
  });

  it("notifies subscribers when the browser fires an 'online' event after being offline", async () => {
    const {
      subscribeConnectivity: subscribe,
      getConnectivitySnapshot: snapshot,
    } = await import("@/shared/lib/connectivity");

    const listener = vi.fn();
    subscribe(listener);

    window.dispatchEvent(new Event("offline"));
    listener.mockClear();
    window.dispatchEvent(new Event("online"));

    expect(snapshot()).toBe(true);
    expect(listener).toHaveBeenCalled();
  });

  it("does not notify listeners when the reported status hasn't actually changed", async () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);
    const { subscribeConnectivity: subscribe } = await import(
      "@/shared/lib/connectivity"
    );

    const listener = vi.fn();
    subscribe(listener);

    // Already online -- a redundant "online" event should be a no-op.
    window.dispatchEvent(new Event("online"));

    expect(listener).not.toHaveBeenCalled();
  });

  it("returns an unsubscribe function that stops further notifications", async () => {
    const { subscribeConnectivity: subscribe } = await import(
      "@/shared/lib/connectivity"
    );

    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    unsubscribe();

    window.dispatchEvent(new Event("offline"));

    expect(listener).not.toHaveBeenCalled();
  });

  it("supports multiple independent subscribers", async () => {
    const { subscribeConnectivity: subscribe } = await import(
      "@/shared/lib/connectivity"
    );

    const listenerA = vi.fn();
    const listenerB = vi.fn();
    subscribe(listenerA);
    subscribe(listenerB);

    window.dispatchEvent(new Event("offline"));

    expect(listenerA).toHaveBeenCalled();
    expect(listenerB).toHaveBeenCalled();
  });
});
