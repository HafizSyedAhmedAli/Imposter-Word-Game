// lib/haptics.ts
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

let hapticsEnabled = true; // mirrors GameSettings.haptics

export function setHapticsEnabled(value: boolean): void {
  hapticsEnabled = value;
}

async function impact(style: ImpactStyle): Promise<void> {
  if (!hapticsEnabled) return;
  try {
    await Haptics.impact({ style });
  } catch {
    // Best-effort -- haptics are a pure enhancement.
  }
}

async function notify(type: NotificationType): Promise<void> {
  if (!hapticsEnabled) return;
  try {
    await Haptics.notification({ type });
  } catch {}
}

export function light(): void {
  void impact(ImpactStyle.Light);
}

export function medium(): void {
  void impact(ImpactStyle.Medium);
}

export function success(): void {
  void notify(NotificationType.Success);
}

export function error(): void {
  void notify(NotificationType.Error);
}

export function warning(): void {
  void notify(NotificationType.Warning);
}
