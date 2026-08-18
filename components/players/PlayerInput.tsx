"use client";

import { useRef, useState } from "react";
import { Plus, User } from "lucide-react";
import { MAX_PLAYER_NAME_LENGTH } from "@/game/game-rules";
import { playSound } from "@/lib/sound-engine";

export default function PlayerInput({
  onAdd,
  error,
  onClearError,
  disabled,
}: {
  onAdd: (name: string) => boolean;
  error: string | null;
  onClearError: () => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    if (disabled) return;
    playSound("ui-tap");
    const added = onAdd(value);
    if (added) {
      setValue("");
      inputRef.current?.focus();
    }
  }

  return (
    <div>
      <label htmlFor="player-name-input" className="sr-only">
        Player name
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div
          className={`flex flex-1 items-center gap-2 rounded-2xl border bg-iw-surface/60 px-4 py-3 transition-colors ${
            error
              ? "border-iw-red"
              : "border-iw-border focus-within:border-iw-violet-400"
          }`}
        >
          <User
            className="h-4 w-4 shrink-0 text-iw-ink-500"
            aria-hidden="true"
          />
          <input
            id="player-name-input"
            ref={inputRef}
            type="text"
            value={value}
            maxLength={MAX_PLAYER_NAME_LENGTH + 10}
            placeholder="Player name"
            disabled={disabled}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) onClearError();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="w-full bg-transparent text-sm text-iw-ink-100 placeholder:text-iw-ink-600 focus:outline-none disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled}
          className="flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-iw-violet-400/40 bg-iw-violet-500/15 px-4 py-3 text-sm font-semibold text-iw-violet-300 transition-all duration-150 hover:-translate-y-0.5 hover:bg-iw-violet-500/25 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          Add Player
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-iw-red">
          {error}
        </p>
      ) : disabled ? (
        <p className="mt-1.5 text-xs font-medium text-iw-gold-400">
          Maximum 12 players
        </p>
      ) : null}
    </div>
  );
}
