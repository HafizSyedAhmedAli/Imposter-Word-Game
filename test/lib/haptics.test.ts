import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock @capacitor/core so we can flip isNativePlatform() per test and
// exercise both the web path (navigator.vibrate, no plugin involved)
// and the native path (real Haptics plugin, no navigator.vibrate
// involved) deterministically.
let isNative = false;
vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => isNative,
  },
}));

// Mock @capacitor/haptics itself for the native-path assertions --
// independent of whatever the real web fallback happens to do in this
// environment, and lets us simulate a native-call failure
// deterministically.
const impactMock = vi.fn().mockResolvedValue(undefined);
const notificationMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@capacitor/haptics", () => ({
  Haptics: {
    impact: (...args: unknown[]) => impactMock(...args),
    notification: (...args: unknown[]) => notificationMock(...args),
  },
  ImpactStyle: { Heavy: "HEAVY", Medium: "MEDIUM", Light: "LIGHT" },
  NotificationType: { Success: "SUCCESS", Warning: "WARNING", Error: "ERROR" },
}));

// Imported after the mocks so every call in these tests hits the fakes
// above instead of the real plugin.
const { setHapticsEnabled, light, medium, success, error, warning } =
  await import("@/lib/haptics");

const vibrateMock = vi.fn();

beforeEach(() => {
  // jsdom has no real Vibration API -- stub one so the web path (the
  // one every button actually hits in the browser/PWA) has something
  // to call.
  Object.defineProperty(navigator, "vibrate", {
    value: vibrateMock,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  isNative = false;
  vibrateMock.mockClear();
  impactMock.mockClear();
  notificationMock.mockClear();
  impactMock.mockResolvedValue(undefined);
  notificationMock.mockResolvedValue(undefined);
  // Restore the default the app boots with (see SoundProvider), so a
  // test that turns haptics off can't leak into the next one.
  setHapticsEnabled(true);
});

describe("web platform (browser / installed PWA -- no Capacitor native shell)", () => {
  it("light() calls navigator.vibrate synchronously, with no plugin involved", () => {
    light();
    // No await here on purpose: this is the whole point of the fix --
    // the call must land in the same tick as the tap, with no promise
    // hop in between, or the browser can drop the user gesture's
    // "transient activation" and silently ignore the vibration.
    expect(vibrateMock).toHaveBeenCalledWith([20]);
    expect(impactMock).not.toHaveBeenCalled();
  });

  it("medium() calls navigator.vibrate with a distinct pattern", () => {
    medium();
    expect(vibrateMock).toHaveBeenCalledWith([43]);
  });

  it("success() calls navigator.vibrate with its pattern", () => {
    success();
    expect(vibrateMock).toHaveBeenCalledWith([35, 65, 21]);
    expect(notificationMock).not.toHaveBeenCalled();
  });

  it("error() calls navigator.vibrate with its pattern", () => {
    error();
    expect(vibrateMock).toHaveBeenCalledWith([27, 45, 50]);
  });

  it("warning() calls navigator.vibrate with its pattern", () => {
    warning();
    expect(vibrateMock).toHaveBeenCalledWith([30, 40, 30, 50, 60]);
  });

  it("suppresses every haptic call while disabled", () => {
    setHapticsEnabled(false);

    light();
    medium();
    success();
    error();
    warning();

    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it("resumes producing haptics once re-enabled", () => {
    setHapticsEnabled(false);
    light();
    expect(vibrateMock).not.toHaveBeenCalled();

    setHapticsEnabled(true);
    light();
    expect(vibrateMock).toHaveBeenCalledTimes(1);
  });

  it("does not throw when navigator.vibrate itself throws", () => {
    vibrateMock.mockImplementationOnce(() => {
      throw new Error("Browser does not support the vibrate API");
    });
    expect(() => light()).not.toThrow();
  });

  it("does not throw when navigator.vibrate is unavailable", () => {
    Object.defineProperty(navigator, "vibrate", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    expect(() => light()).not.toThrow();
  });
});

describe("native platform (Capacitor native shell)", () => {
  beforeEach(() => {
    isNative = true;
  });

  it("light() triggers a Light impact via the native plugin, not navigator.vibrate", async () => {
    light();
    await Promise.resolve();
    expect(impactMock).toHaveBeenCalledWith({ style: "LIGHT" });
    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it("medium() triggers a Medium impact", async () => {
    medium();
    await Promise.resolve();
    expect(impactMock).toHaveBeenCalledWith({ style: "MEDIUM" });
  });

  it("success() triggers a Success notification", async () => {
    success();
    await Promise.resolve();
    expect(notificationMock).toHaveBeenCalledWith({ type: "SUCCESS" });
  });

  it("error() triggers an Error notification", async () => {
    error();
    await Promise.resolve();
    expect(notificationMock).toHaveBeenCalledWith({ type: "ERROR" });
  });

  it("warning() triggers a Warning notification", async () => {
    warning();
    await Promise.resolve();
    expect(notificationMock).toHaveBeenCalledWith({ type: "WARNING" });
  });

  it("suppresses every haptic call while disabled", async () => {
    setHapticsEnabled(false);

    light();
    medium();
    success();
    error();
    warning();
    await Promise.resolve();

    expect(impactMock).not.toHaveBeenCalled();
    expect(notificationMock).not.toHaveBeenCalled();
  });

  it("does not throw when the native call rejects", async () => {
    impactMock.mockRejectedValueOnce(new Error("native failure"));
    expect(() => light()).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
  });
});
