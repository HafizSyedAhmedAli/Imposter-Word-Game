"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Languages } from "lucide-react";
import { light } from "@/lib/haptics";
import {
  DEFAULT_SETTINGS,
  getSettings,
  updateSettings,
  type GameSettings,
} from "@/lib/settings-store";
import { LANGUAGES } from "@/game/game-rules";
import type { GameLanguage } from "@/game/game-types";

/**
 * Settings screen card for choosing the round content language (word +
 * hint). Mirrors PreferencesCard's load/optimistic-update pattern
 * exactly -- Dexie is the single source of truth (see
 * lib/settings-store.ts), and the local `settings` state is updated
 * immediately so the tap feels instant, with the persisted write
 * happening in the background.
 *
 * IMPORTANT: this only ever affects *future* rounds. The round currently
 * in progress (if any) already has its own frozen `language` on
 * `RoundSession.round` -- see game/game-engine.ts's `prepareGameRound`.
 * Changing the selection here can never retroactively change a round
 * that's already being played.
 */
export default function LanguageCard() {
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

  const handleSelect = useCallback(
    (language: GameLanguage) => {
      if (!settings || settings.language === language) return;
      setSettings({ ...settings, language });
      void updateSettings({ language });
      light();
    },
    [settings],
  );

  const language = settings?.language ?? DEFAULT_SETTINGS.language;
  const loading = settings === null;

  return (
    <section
      className="rounded-3xl border border-iw-border bg-iw-surface/40 p-4 backdrop-blur-sm animate-iw-fade-up sm:p-5"
      style={{ animationDelay: "60ms" }}
    >
      <div className="flex items-center gap-2">
        <Languages
          className="h-5 w-5 text-iw-gold-400"
          strokeWidth={2.25}
          aria-hidden="true"
        />
        <h2 className="font-display text-lg font-semibold tracking-wide text-iw-ink-100 sm:text-xl">
          LANGUAGE
        </h2>
      </div>
      <p className="mt-1 text-sm text-iw-ink-500">
        Choose the language for words and hints. Applies to your next round.
      </p>

      <div
        role="radiogroup"
        aria-label="Language"
        className="mt-4 flex flex-col gap-2.5 sm:flex-row"
      >
        {LANGUAGES.map((option) => {
          const selected = language === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={loading}
              onClick={() => handleSelect(option.id)}
              className={`relative flex flex-1 flex-col items-start gap-1 rounded-2xl border px-3.5 py-3.5 text-left transition-all duration-150 sm:px-4 sm:py-4 ${
                loading ? "cursor-default opacity-60" : "cursor-pointer"
              } ${
                selected
                  ? "border-iw-violet-400 bg-iw-violet-500/10 shadow-[0_0_0_1px_rgba(167,139,250,0.45),0_0_22px_-6px_rgba(167,139,250,0.55)]"
                  : "border-iw-border bg-iw-surface/40 hover:-translate-y-0.5"
              }`}
            >
              {selected && (
                <span
                  className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-iw-violet-500/20 text-iw-violet-300 animate-iw-fade-in"
                  aria-hidden="true"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              )}
              <span
                className={`font-display text-sm font-bold tracking-wide sm:text-base ${
                  selected ? "text-iw-violet-300" : "text-iw-ink-100"
                }`}
              >
                {option.label}
              </span>
              <span className="text-xs leading-snug text-iw-ink-300 sm:text-sm">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
