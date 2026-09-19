// lib/haptics.ts
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

let hapticsEnabled = true; // mirrors GameSettings.haptics

export function setHapticsEnabled(value: boolean): void {
  hapticsEnabled = value;
}

// Patterns mirror @capacitor/haptics' own web fallback (see
// node_modules/@capacitor/haptics/.../web.js) so on-device feel is
// unchanged -- we're only changing *how* we get to navigator.vibrate,
// not the patterns themselves.
const IMPACT_PATTERN: Record<"light" | "medium", number[]> = {
  light: [20],
  medium: [43],
};

const NOTIFICATION_PATTERN: Record<"success" | "error" | "warning", number[]> = {
  success: [35, 65, 21],
  error: [27, 45, 50],
  warning: [30, 40, 30, 50, 60],
};

/**
 * Fires a vibration pattern.
 *
 * IMPORTANT: on web this calls navigator.vibrate() synchronously,
 * in-line, with no `await` in front of it. Browsers only honor
 * navigator.vibrate() when it's the direct, synchronous result of a
 * user gesture ("transient activation"); routing it through the
 * Capacitor Haptics plugin's web fallback means going through an
 * async proxy call (and, on its very first use, a dynamic import of
 * the web implementation) before navigator.vibrate() ever runs. That
 * extra promise/microtask hop can land outside the gesture's
 * activation window, so the call silently no-ops -- which is why some
 * buttons "worked" (whichever happened to win the race) and others
 * didn't. Calling navigator.vibrate() directly here removes that
 * indirection entirely, so every caller behaves the same way.
 *
 * On native (Capacitor) builds there's no such browser restriction, so
 * we go through the real native Haptics plugin as before for the
 * correct on-device feel (Taptic Engine, etc.).
 */
function vibrate(pattern: number[]): void {
  if (!hapticsEnabled) return;

  if (Capacitor.isNativePlatform()) {
    void nativeVibrate(pattern);
    return;
  }

  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Best-effort -- haptics are a pure enhancement.
  }
}

async function nativeVibrate(pattern: number[]): Promise<void> {
  try {
    if (pattern.length === 1) {
      const style =
        pattern[0] <= 20 ? ImpactStyle.Light : ImpactStyle.Medium;
      await Haptics.impact({ style });
      return;
    }
    const type =
      pattern === NOTIFICATION_PATTERN.error
        ? NotificationType.Error
        : pattern === NOTIFICATION_PATTERN.warning
          ? NotificationType.Warning
          : NotificationType.Success;
    await Haptics.notification({ type });
  } catch {
    // Best-effort -- haptics are a pure enhancement.
  }
}

export function light(): void {
  vibrate(IMPACT_PATTERN.light);
}

export function medium(): void {
  vibrate(IMPACT_PATTERN.medium);
}

export function success(): void {
  vibrate(NOTIFICATION_PATTERN.success);
}

export function error(): void {
  vibrate(NOTIFICATION_PATTERN.error);
}

export function warning(): void {
  vibrate(NOTIFICATION_PATTERN.warning);
}