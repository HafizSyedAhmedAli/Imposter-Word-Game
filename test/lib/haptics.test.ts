import { afterEach, describe, expect, it, vi } from "vitest";

// Mock @capacitor/haptics itself rather than relying on jsdom's (missing)
// navigator.vibrate -- this keeps the assertions about *which* style/type
// was requested independent of whatever the real web fallback happens to
// do in this environment, and lets us simulate a native-call failure
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

// Imported after the mock so every call in these tests hits the fakes
// above instead of the real plugin.
const { setHapticsEnabled, light, medium, success, error, warning } =
  await import("@/lib/haptics");

afterEach(() => {
  impactMock.mockClear();
  notificationMock.mockClear();
  impactMock.mockResolvedValue(undefined);
  notificationMock.mockResolvedValue(undefined);
  // Restore the default the app boots with (see SoundProvider), so a
  // test that turns haptics off can't leak into the next one.
  setHapticsEnabled(true);
});

describe("haptics enabled (default / after setHapticsEnabled(true))", () => {
  it("light() triggers a Light impact", async () => {
    light();
    await Promise.resolve();
    expect(impactMock).toHaveBeenCalledWith({ style: "LIGHT" });
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
});

describe("haptics disabled (setHapticsEnabled(false))", () => {
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

  it("resumes producing haptics once re-enabled", async () => {
    setHapticsEnabled(false);
    light();
    await Promise.resolve();
    expect(impactMock).not.toHaveBeenCalled();

    setHapticsEnabled(true);
    light();
    await Promise.resolve();
    expect(impactMock).toHaveBeenCalledTimes(1);
  });
});

describe("haptic failures never throw", () => {
  it("light() does not throw when the native/web call rejects", async () => {
    impactMock.mockRejectedValueOnce(
      new Error("Browser does not support the vibrate API"),
    );
    expect(() => light()).not.toThrow();
    // Let the rejected promise settle inside the fire-and-forget call so
    // an unhandled rejection would surface here if the catch were missing.
    await Promise.resolve();
    await Promise.resolve();
  });

  it("warning() does not throw when the native/web call rejects", async () => {
    notificationMock.mockRejectedValueOnce(new Error("native failure"));
    expect(() => warning()).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
  });
});
