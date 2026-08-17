// lib/haptics.ts
/**
 * Thin wrapper around the Vibration API. Feature-detected throughout:
 * devices/browsers without support (most notably iOS Safari, which
 * never implemented this API) simply produce no feedback -- never an
 * error (spec: "the setting can remain available but should simply
 * have no effect on unsupported devices").
 */
export function triggerHaptic(pattern: number | number[] = 15): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Best-effort -- see doc comment above.
  }
}
