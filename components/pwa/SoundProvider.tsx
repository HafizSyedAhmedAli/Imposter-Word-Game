// components/pwa/SoundProvider.tsx
"use client";

import { useEffect } from "react";
import { getSettings } from "@/lib/settings-store";
import {
  preloadSounds,
  primeAudioUnlock,
  setMusicEnabled,
  setSoundEnabled,
} from "@/lib/sound-engine";

export default function SoundProvider() {
  useEffect(() => {
    let cancelled = false;
    primeAudioUnlock();
    getSettings().then((settings) => {
      if (cancelled) return;
      setSoundEnabled(settings.sound);
      setMusicEnabled(settings.music);
      preloadSounds();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
