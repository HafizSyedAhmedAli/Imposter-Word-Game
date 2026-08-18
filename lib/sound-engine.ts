// lib/sound-engine.ts
/**
 * Real-audio-file sound layer, replacing the old synthesized-tone
 * approach in lib/sound.ts (deprecated -- see that file's note). Uses
 * Howler for playback because it handles iOS/Safari's autoplay-unlock
 * dance, simultaneous overlapping playback, and fade in/out far more
 * reliably than raw <audio> elements.
 *
 * Every file this module references lives in public/sounds/ and MUST
 * also be listed in public/sw-template.js's PRECACHE_URLS -- see the
 * comment there. If a file 404s or fails to decode at runtime, Howler's
 * `onloaderror` marks that key dead and playSound() silently no-ops for
 * it from then on -- it never throws.
 */
import { Howl, Howler } from "howler";

export type SoundKey =
  | "ambient-menu"
  | "game-start"
  | "ui-tap"
  | "ui-confirm"
  | "ui-error"
  | "transition-pass"
  | "phase-discussion"
  | "reveal-player"
  | "timer-tick"
  | "timer-end"
  | "results-lose"
  | "result-imposter-wins"
  | "result-crew-wins";

const SRC: Record<SoundKey, string> = {
  "ambient-menu": "/sounds/ambient-menu.mp3",
  "game-start": "/sounds/game-start.mp3",
  "ui-tap": "/sounds/ui-tap.mp3",
  "ui-confirm": "/sounds/ui-confirm.mp3",
  "ui-error": "/sounds/ui-error.mp3",
  "transition-pass": "/sounds/transition-pass.mp3",
  "phase-discussion": "/sounds/phase-discussion.mp3",
  "reveal-player": "/sounds/reveal-player.mp3",
  "timer-tick": "/sounds/timer-tick.mp3",
  "timer-end": "/sounds/timer-end.mp3",
  "results-lose": "/sounds/results-lose.mp3",
  "result-imposter-wins": "/sounds/result-imposter-wins.mp3",
  "result-crew-wins": "/sounds/result-crew-wins.mp3",
};

// One-shot SFX only. Looping tracks (currently just "ambient-menu") are
// handled separately by playAmbient()/stopAmbient() below and never go
// through this map.
const LOOPING: ReadonlySet<SoundKey> = new Set(["ambient-menu"]);

const cache = new Map<SoundKey, Howl>();
const failed = new Set<SoundKey>();

let enabled = true; // mirrors GameSettings.sound, set once by SoundProvider
let ambientHowl: Howl | null = null;

function getHowl(key: SoundKey): Howl | null {
  if (failed.has(key)) return null;

  const existing = cache.get(key);
  if (existing) return existing;

  const howl = new Howl({
    src: [SRC[key]],
    preload: true,
    loop: LOOPING.has(key),
    onloaderror: () => {
      // A 404/decode failure marks the key dead for the rest of the
      // session -- never retried, never thrown, matches the
      // best-effort philosophy of the old lib/sound.ts.
      failed.add(key);
      cache.delete(key);
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[sound-engine] failed to load "${key}" (${SRC[key]})`);
      }
    },
  });

  cache.set(key, howl);
  return howl;
}

/** Called once by SoundProvider on mount, and again whenever the user
 * flips the Sound toggle in Settings. */
export function setSoundEnabled(value: boolean): void {
  enabled = value;
  Howler.mute(!value);
  if (!value) stopAmbient(0);
}

/** Warms every known-available key's Howl instance up front so the
 * first play of each (e.g. the very first role reveal) isn't the
 * moment the file is fetched. Safe to call multiple times. */
export function preloadSounds(): void {
  (Object.keys(SRC) as SoundKey[]).forEach((key) => {
    if (!LOOPING.has(key)) getHowl(key);
  });
}

/**
 * Plays a one-shot sound effect. Always safe to call regardless of
 * `enabled`, missing file, or blocked audio context -- never throws.
 */
export function playSound(
  key: SoundKey,
  opts?: { volume?: number },
): number | null {
  if (!enabled) return null;
  try {
    const howl = getHowl(key);
    if (!howl) return null;
    const id = howl.play();
    if (opts?.volume !== undefined) howl.volume(opts.volume, id);
    return id;
  } catch {
    return null;
  }
}

/** Stops a specific previously-played instance (e.g. a long timer-tick
 * track started early and cut off once the timer actually hits 0). */
export function stopSound(key: SoundKey, id: number | null): void {
  if (id === null) return;
  try {
    cache.get(key)?.stop(id);
  } catch {
    // Best-effort.
  }
}

/** Starts the looping ambient bed at low volume with a short fade-in.
 * No-ops if sound is disabled or the file failed to load. */
export function playAmbient(fadeMs = 600, targetVolume = 0.18): void {
  if (!enabled) return;
  if (ambientHowl?.playing()) return;

  const howl = getHowl("ambient-menu");
  if (!howl) return;

  howl.volume(0);
  howl.play();
  howl.fade(0, targetVolume, fadeMs);
  ambientHowl = howl;
}

/** Fades out and stops the ambient bed. Safe to call even if it was
 * never started. */
export function stopAmbient(fadeMs = 400): void {
  const howl = ambientHowl;
  if (!howl) return;
  if (fadeMs <= 0) {
    howl.stop();
    return;
  }
  howl.fade(howl.volume(), 0, fadeMs);
  howl.once("fade", () => howl.stop());
}
