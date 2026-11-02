// lib/sound-engine.ts
import { Capacitor } from "@capacitor/core";
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
// Bumped on every stopAmbientPlayback() call so its deferred `stop()`
// (fired once the fade-out completes) can tell whether it's still the
// most recent fade-out request. If playback resumes before the fade
// finishes, the token no longer matches and the stale callback is a
// no-op instead of stopping audio that was just restarted.
let ambientFadeOutToken = 0;
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
    // Mute/stop playback only -- don't clear ambientWanted. Whether the
    // menu bed *should* be playing is route intent owned exclusively by
    // MenuMusicController; the Music toggle should only gate whether
    // that intent is honored, not overwrite it. Otherwise a direct
    // game route could pick up stale menu-music intent the next time
    // settings load and flip this back on.
    stopAmbientPlayback(300);
  } else if (audioUnlocked) {
    // Re-attempt playback immediately -- if the current screen already
    // wants ambient playing (Settings is itself one of the menu
    // screens), this starts it right away instead of waiting for the
    // next navigation. Calls startAmbientPlayback directly (not
    // playAmbient) so it still respects the existing ambientWanted
    // flag instead of setting it.
    startAmbientPlayback(600, 0.18);
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

  const howl = getHowl("ambient-menu");
  if (!howl) return;

  // Invalidate any in-flight fade-out so its deferred stop() (queued
  // below in stopAmbientPlayback) becomes a no-op instead of killing
  // playback we're about to resume/keep alive.
  ambientFadeOutToken += 1;

  if (howl.playing()) {
    // Re-entering the menu flow mid fade-out -- the Howl is still
    // playing (just quiet), so fade it back up rather than restarting
    // it from volume 0.
    howl.fade(howl.volume(), targetVolume, fadeMs);
    ambientHowl = howl;
    return;
  }

  howl.volume(0);
  howl.play();
  howl.fade(0, targetVolume, fadeMs);
  ambientHowl = howl;
}

function stopAmbientPlayback(fadeMs: number): void {
  const howl = ambientHowl;
  if (!howl) return;
  if (fadeMs <= 0) {
    howl.stop();
    return;
  }
  const token = ++ambientFadeOutToken;
  howl.fade(howl.volume(), 0, fadeMs);
  howl.once("fade", () => {
    // Playback was resumed (and the token bumped) before this fade-out
    // finished -- don't stop audio the caller just asked to keep going.
    if (token !== ambientFadeOutToken) return;
    howl.stop();
  });
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
  stopAmbientPlayback(fadeMs);
}

const AMBIENT_CONTINUITY_KEY = "iwg:ambient-continuity";

/**
 * Called via lib/offline-navigation.ts's onBeforeHardNavigate, right
 * before an offline navigation forces a real document reload. A reload
 * destroys this module's in-memory state (and the Howl/AudioContext
 * with it), so this can't preserve actual playback -- only sessionStorage
 * survives -- but it lets the next mount know the bed *was* playing, so
 * it can resume as a continuation instead of a fresh start. See
 * consumeAmbientContinuity, which reads this back.
 */
export function persistAmbientContinuity(): void {
  if (typeof window === "undefined") return;
  try {
    if (ambientWanted) {
      window.sessionStorage.setItem(AMBIENT_CONTINUITY_KEY, "1");
    } else {
      window.sessionStorage.removeItem(AMBIENT_CONTINUITY_KEY);
    }
  } catch {
    // Best-effort -- ignore storage errors (private browsing, quota, etc).
  }
}

/**
 * Reads and clears the flag set by persistAmbientContinuity. Call once
 * per mount, before deciding how to (re)start the ambient bed, so a
 * stale flag never lingers into some unrelated later navigation.
 */
export function consumeAmbientContinuity(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const flag = window.sessionStorage.getItem(AMBIENT_CONTINUITY_KEY) === "1";
    window.sessionStorage.removeItem(AMBIENT_CONTINUITY_KEY);
    return flag;
  } catch {
    return false;
  }
}

export function primeAudioUnlock(): void {
  if (unlockListenerAttached || typeof window === "undefined") return;
  unlockListenerAttached = true;

  if (isRunningAsInstalledPwa() || Capacitor.isNativePlatform()) {
    // Installed PWA and the Capacitor Android/iOS shell both run
    // outside a browser tab, so the tab-autoplay policy that gates
    // <audio>/WebAudio behind a user gesture doesn't apply -- without
    // this branch, `ambient-menu` silently waited for the first
    // pointerdown/keydown/touchstart, which is the exact "music
    // doesn't play until I tap once" bug on a physical Android build.
    audioUnlocked = true;
    // Defense-in-depth for ordering; in practice MenuMusicController's
    // own playAmbient() call right after this on mount is what
    // actually starts it, now that audioUnlocked is already true.
    startAmbientPlayback(600, 0.18);
    return;
  }

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

function isRunningAsInstalledPwa(): boolean {
  if (typeof window === "undefined") return false;

  const standaloneDisplayMode =
    window.matchMedia?.("(display-mode: standalone)").matches ?? false;

  // iOS Safari doesn't support the standalone display-mode media query
  // at all; it exposes this non-standard boolean on navigator instead.
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true;

  return standaloneDisplayMode || iosStandalone;
}
