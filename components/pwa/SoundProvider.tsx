// components/pwa/SoundProvider.tsx
"use client";

import { useEffect } from "react";
import { getSettings } from "@/lib/settings-store";
import { preloadSounds, setSoundEnabled } from "@/lib/sound-engine";

/**
 * App-wide sound bootstrap. Reads the persisted Sound setting once on
 * mount and applies it to the engine, then preloads every available
 * SFX so later playSound() calls are instant. Renders nothing -- same
 * pattern as ServiceWorkerRegister.
 *
 * Deliberately does NOT expose React context: every consumer imports
 * playSound()/etc. directly from lib/sound-engine.ts, the same direct-
 * import convention lib/haptics.ts already uses.
 */
export default function SoundProvider() {
  useEffect(() => {
    let cancelled = false;
    getSettings().then((settings) => {
      if (cancelled) return;
      setSoundEnabled(settings.sound);
      preloadSounds();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
