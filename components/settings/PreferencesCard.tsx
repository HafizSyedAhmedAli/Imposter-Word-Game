"use client";

import { light, setHapticsEnabled } from "@/lib/haptics";
import {
  DEFAULT_SETTINGS,
  getSettings,
  updateSettings,
  type GameSettings,
} from "@/lib/settings-store";
import {
  playSound,
  setMusicEnabled,
  setSoundEnabled,
} from "@/lib/sound-engine";
import {
  HeadphoneOff,
  Headphones,
  Vibrate,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import SettingsToggleRow from "./SettingsToggleRow";

export default function PreferencesCard() {
  const [settings, setSettings] = useState<GameSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSettings().then((loaded) => {
      if (!cancelled) setSettings(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleSound = useCallback(() => {
    if (!settings) return;
    const next = !settings.sound;
    setSettings({ ...settings, sound: next });
    void updateSettings({ sound: next });
    setSoundEnabled(next);
    if (next) playSound("ui-confirm");
  }, [settings]);

  const handleToggleMusic = useCallback(() => {
    if (!settings) return;
    const next = !settings.music;
    setSettings({ ...settings, music: next });
    void updateSettings({ music: next });
    setMusicEnabled(next);
  }, [settings]);

  const handleToggleHaptics = useCallback(() => {
    if (!settings) return;
    const next = !settings.haptics;
    setSettings({ ...settings, haptics: next });
    void updateSettings({ haptics: next }); // same Dexie table, no new store
    setHapticsEnabled(next);
    if (next) light(); // confirmation buzz only when turning ON
  }, [settings]);

  const sound = settings?.sound ?? DEFAULT_SETTINGS.sound;
  const music = settings?.music ?? DEFAULT_SETTINGS.music;
  const haptics = settings?.haptics ?? DEFAULT_SETTINGS.haptics;
  const loading = settings === null;

  return (
    <section
      className="rounded-3xl border border-iw-border bg-iw-surface/40 p-4 backdrop-blur-sm animate-iw-fade-up sm:p-5"
      style={{ animationDelay: "0ms" }}
    >
      <h2 className="font-display text-lg font-semibold tracking-wide text-iw-ink-100 sm:text-xl">
        SOUND & HAPTICS
      </h2>
      <p className="mt-1 text-sm text-iw-ink-500">
        Saved on this device and applied next time you play.
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        <SettingsToggleRow
          icon={sound ? Volume2 : VolumeX}
          title="Sound"
          description="Play sound effects during the game"
          enabled={sound}
          onToggle={handleToggleSound}
          disabled={loading}
        />
        <SettingsToggleRow
          icon={music ? Headphones : HeadphoneOff}
          title="Music"
          description="Play menu music before the game starts"
          enabled={music}
          onToggle={handleToggleMusic}
          disabled={loading}
        />
        <SettingsToggleRow
          icon={Vibrate}
          title="Haptics"
          description="Vibrate on taps and key moments"
          enabled={haptics}
          onToggle={handleToggleHaptics}
          disabled={loading}
        />
      </div>
    </section>
  );
}
