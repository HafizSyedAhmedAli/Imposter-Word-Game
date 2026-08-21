// lib/sound-engine.ts
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

const LOOPING: ReadonlySet<SoundKey> = new Set(["ambient-menu"]);

const cache = new Map<SoundKey, Howl>();
const failed = new Set<SoundKey>();

let enabled = true; // mirrors GameSettings.sound (SFX only)
let musicEnabled = true; // mirrors GameSettings.music (ambient bed only) -- deliberately independent of `enabled`
let ambientHowl: Howl | null = null;
let ambientWanted = false;
let audioUnlocked = false;
let unlockListenerAttached = false;

function getHowl(key: SoundKey): Howl | null {
  if (failed.has(key)) return null;

  const existing = cache.get(key);
  if (existing) return existing;

  const howl = new Howl({
    src: [SRC[key]],
    preload: true,
    loop: LOOPING.has(key),
    onloaderror: () => {
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
 * flips the Sound toggle in Settings. Only touches non-looping (SFX)
 * Howls, so it can never affect the ambient bed -- Music has its own
 * independent toggle, see setMusicEnabled below. */
export function setSoundEnabled(value: boolean): void {
  enabled = value;
  cache.forEach((howl, key) => {
    if (!LOOPING.has(key)) howl.mute(!value);
  });
}

/** Called once by SoundProvider on mount, and again whenever the user
 * flips the Music toggle in Settings. Independent of `enabled` -- SFX
 * and the ambient menu bed can be toggled separately. */
export function setMusicEnabled(value: boolean): void {
  musicEnabled = value;
  if (!value) {
    stopAmbient(300);
  } else {
    // Re-attempt playback immediately -- if the current screen wants
    // ambient playing (Settings is itself one of the menu screens),
    // this starts it right away instead of waiting for the next
    // navigation.
    playAmbient();
  }
}

export function preloadSounds(): void {
  (Object.keys(SRC) as SoundKey[]).forEach((key) => {
    if (!LOOPING.has(key)) getHowl(key);
  });
}

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

export function stopSound(key: SoundKey, id: number | null): void {
  if (id === null) return;
  try {
    cache.get(key)?.stop(id);
  } catch {
    // Best-effort.
  }
}

function startAmbientPlayback(fadeMs: number, targetVolume: number): void {
  if (!musicEnabled || !ambientWanted) return;
  if (ambientHowl?.playing()) return;

  const howl = getHowl("ambient-menu");
  if (!howl) return;

  howl.volume(0);
  howl.play();
  howl.fade(0, targetVolume, fadeMs);
  ambientHowl = howl;
}

/**
 * Call ONCE for the whole app's lifetime (from a root-level component,
 * never from a single screen) so a gesture on *any* screen counts --
 * including one that immediately navigates away. Without this, a
 * screen-scoped listener loses the race: the tap that unlocks audio is
 * often the same tap that navigates elsewhere a beat later, and
 * ctx.resume() hasn't finished before the old screen's cleanup stops
 * the Howl.
 */
export function primeAudioUnlock(): void {
  if (unlockListenerAttached || typeof window === "undefined") return;
  unlockListenerAttached = true;

  const events: Array<keyof WindowEventMap> = [
    "pointerdown",
    "keydown",
    "touchstart",
  ];

  const handleFirstInteraction = () => {
    events.forEach((evt) =>
      window.removeEventListener(evt, handleFirstInteraction),
    );
    audioUnlocked = true;
    Howler.ctx?.resume?.();
    startAmbientPlayback(600, 0.18);
  };

  events.forEach((evt) =>
    window.addEventListener(evt, handleFirstInteraction, {
      once: true,
      capture: true,
    }),
  );
}

/** Starts the looping ambient bed at low volume with a short fade-in.
 * Called by MenuMusicController whenever navigation enters the menu
 * flow from outside it -- NOT on every menu-to-menu navigation, so the
 * bed never restarts while the user is just browsing Home/Settings/
 * How to Play/Setup/Players. No-ops if music is disabled, the file
 * failed to load, or it's already playing. */
export function playAmbient(fadeMs = 600, targetVolume = 0.18): void {
  ambientWanted = true;
  if (!musicEnabled) return;
  if (audioUnlocked) {
    startAmbientPlayback(fadeMs, targetVolume);
  }
}

/** Fades out and stops the ambient bed. Safe to call even if it was
 * never started. Called by MenuMusicController with a longer fade when
 * leaving the menu flow for the actual game, so the transition reads
 * as an intentional fade rather than an abrupt cut. */
export function stopAmbient(fadeMs = 400): void {
  ambientWanted = false;
  const howl = ambientHowl;
  if (!howl) return;
  if (fadeMs <= 0) {
    howl.stop();
    return;
  }
  howl.fade(howl.volume(), 0, fadeMs);
  howl.once("fade", () => howl.stop());
}
