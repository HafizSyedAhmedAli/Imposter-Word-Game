import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isKnownAppRoute,
  navigateInternal,
  onBeforeHardNavigate,
} from "@/shared/lib/offline-navigation";
import { APP_ROUTES } from "@/shared/lib/app-routes";

describe("isKnownAppRoute", () => {
  it("recognizes every route in APP_ROUTES", () => {
    for (const route of APP_ROUTES) {
      expect(isKnownAppRoute(route)).toBe(true);
    }
  });

  it("rejects a route that isn't part of the app", () => {
    expect(isKnownAppRoute("/not-a-real-route")).toBe(false);
  });

  it("strips a query string before matching", () => {
    const [route] = APP_ROUTES;
    expect(isKnownAppRoute(`${route}?foo=bar`)).toBe(true);
  });

  it("strips a hash fragment before matching", () => {
    const [route] = APP_ROUTES;
    expect(isKnownAppRoute(`${route}#section`)).toBe(true);
  });

  it("strips both a query string and a hash fragment together", () => {
    const [route] = APP_ROUTES;
    expect(isKnownAppRoute(`${route}?foo=bar#section`)).toBe(true);
  });

  it("rejects an external URL", () => {
    expect(isKnownAppRoute("https://example.com")).toBe(false);
  });
});

describe("navigateInternal", () => {
  const targetRoute = APP_ROUTES[0];
  let assignSpy: ReturnType<typeof vi.fn>;
  let replaceSpy: ReturnType<typeof vi.fn>;
  let originalLocation: Location;

  beforeEach(() => {
    // jsdom's window.location.assign/replace can't be spied on directly
    // (they're non-configurable on the real Location object), so the
    // whole property is swapped for a plain mock object for the
    // duration of each test and restored afterwards.
    originalLocation = window.location;
    assignSpy = vi.fn();
    replaceSpy = vi.fn();
    // @ts-expect-error -- deleting window.location so it can be reassigned
    delete window.location;
    Object.defineProperty(window, "location", {
      value: { assign: assignSpy, replace: replaceSpy },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("does nothing and returns false while online, even for a known route", () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);

    const handled = navigateInternal(targetRoute);

    expect(handled).toBe(false);
    expect(assignSpy).not.toHaveBeenCalled();
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it("does nothing and returns false while offline for a route the app doesn't know about", () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);

    const handled = navigateInternal("/not-a-real-route");

    expect(handled).toBe(false);
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it("forces a real document navigation via window.location.assign while offline for a known route", () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);

    const handled = navigateInternal(targetRoute);

    expect(handled).toBe(true);
    expect(assignSpy).toHaveBeenCalledWith(targetRoute);
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it("uses window.location.replace instead of assign when replace=true", () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);

    const handled = navigateInternal(targetRoute, true);

    expect(handled).toBe(true);
    expect(replaceSpy).toHaveBeenCalledWith(targetRoute);
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it("notifies onBeforeHardNavigate listeners before performing the hard navigation", () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
    const listener = vi.fn();
    const unsubscribe = onBeforeHardNavigate(listener);

    navigateInternal(targetRoute);

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("stops notifying a listener after it unsubscribes", () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
    const listener = vi.fn();
    const unsubscribe = onBeforeHardNavigate(listener);
    unsubscribe();

    navigateInternal(targetRoute);

    expect(listener).not.toHaveBeenCalled();
  });

  it("never notifies onBeforeHardNavigate listeners for a no-op (online) call", () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);
    const listener = vi.fn();
    const unsubscribe = onBeforeHardNavigate(listener);

    navigateInternal(targetRoute);

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});
