// lib/haptics.ts
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

/**
 * Centralized haptic feedback utility. Every component calls one of the
 * named functions below (light/medium/success/error/warning) -- nobody
 * outside this file imports @capacitor/haptics or touches ImpactStyle/
 * NotificationType directly. Same shape as lib/sound-engine.ts's
 * playSound(key): callers say what happened, not how it's implemented.
 *
 * Gated by the user's Haptics setting (lib/settings-store.ts) through
 * setHapticsEnabled(), mirroring setSoundEnabled()/setMusicEnabled() --
 * SoundProvider calls this alongside those on mount and whenever the
 * Settings screen toggles it.
 *
 * @capacitor/haptics itself is cross-platform: on native Android/iOS it
 * drives the real haptic engine; in a plain browser tab or installed
 * PWA it falls back to the Vibration API, and on a browser that doesn't
 * implement that API either (notably iOS Safari) it throws instead of
 * silently doing nothing. Every call here is wrapped in try/catch for
 * exactly that reason -- haptics are a pure enhancement and a failure
 * must never surface to the user or interrupt gameplay.
 */

let hapticsEnabled = true; // mirrors GameSettings.haptics

/**
 * Called once by SoundProvider on mount (after reading saved settings),
 * and again whenever the user flips the Haptics toggle in Settings.
 */
export function setHapticsEnabled(value: boolean): void {
  hapticsEnabled = value;
}

async function impact(style: ImpactStyle): Promise<void> {
  if (!hapticsEnabled) return;
  try {
    await Haptics.impact({ style });
  } catch {
    // Best-effort -- see doc comment above.
  }
}

async function notify(type: NotificationType): Promise<void> {
  if (!hapticsEnabled) return;
  try {
    await Haptics.notification({ type });
  } catch {
    // Best-effort -- see doc comment above.
  }
}

/**
 * A light tick for everyday confirmations: generic button/action
 * confirmations, the player-reveal moment, the pass-phone handoff, and
 * picking a vote target.
 */
export function light(): void {
  void impact(ImpactStyle.Light);
}

/**
 * A heavier beat for moments with real game consequence: casting a
 * vote, a player being eliminated, or submitting a final guess.
 */
export function medium(): void {
  void impact(ImpactStyle.Medium);
}

/** Crew victory / imposter victory. */
export function success(): void {
  void notify(NotificationType.Success);
}

/** An invalid or blocked action (e.g. trying to continue with too few
 * players). */
export function error(): void {
  void notify(NotificationType.Error);
}

/** Confirming a destructive action, e.g. Reset Game Data. */
export function warning(): void {
  void notify(NotificationType.Warning);
}