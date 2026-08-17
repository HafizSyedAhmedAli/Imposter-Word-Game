// lib/sound.ts
/**
 * Minimal, dependency-free sound-effect layer. No audio files ship with
 * the app -- feedback tones are synthesized on the fly with the Web
 * Audio API, so there's nothing to fetch, cache, or fail to load
 * offline. Every call is best-effort: unsupported or blocked audio
 * contexts (missing API, autoplay restrictions, iOS Safari before a
 * user gesture) must never throw or otherwise disrupt the caller.
 */

let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) {
    sharedContext = new Ctor();
  }
  return sharedContext;
}

function playTone(frequency: number, durationMs: number): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    // Browsers suspend new contexts until a user gesture; this call
    // itself only ever runs from a click handler, so resume() is safe.
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    const now = ctx.currentTime;
    const duration = durationMs / 1000;
    // Short exponential envelope so the tone reads as a soft "chirp"
    // rather than an abrupt click.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch {
    // Best-effort -- see doc comment above.
  }
}

/** Short confirmation chirp played when Sound is switched on in Settings. */
export function playToggleTone(): void {
  playTone(660, 90);
}
