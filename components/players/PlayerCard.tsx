"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Player } from "@/game/game-types";
import { MAX_PLAYER_NAME_LENGTH } from "@/game/game-rules";
import type { PlayerActionResult } from "@/lib/game-setup-context";
import PlayerAvatar from "./PlayerAvatar";

export default function PlayerCard({
  player,
  index,
  onRemove,
  onEdit,
}: {
  player: Player;
  index: number;
  onRemove: () => void;
  onEdit: (name: string) => PlayerActionResult;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(player.name);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setDraft(player.name);
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
    setDraft(player.name);
  }

  function saveEdit() {
    const result = onEdit(draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditing(false);
    setError(null);
  }

  if (editing) {
    return (
      <li className="animate-iw-fade-in rounded-2xl border border-iw-violet-400 bg-iw-surface-2 p-3">
        <div className="flex items-center gap-3">
          <PlayerAvatar index={index} />
          <input
            autoFocus
            type="text"
            value={draft}
            maxLength={MAX_PLAYER_NAME_LENGTH + 10}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveEdit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancelEdit();
              }
            }}
            aria-label={`Edit ${player.name}`}
            className="min-w-0 flex-1 rounded-xl border border-iw-border bg-iw-surface px-3 py-2 text-sm text-iw-ink-100 focus:border-iw-violet-400 focus:outline-none"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="mt-1.5 pl-12 text-xs font-semibold text-iw-red"
          >
            {error}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-2 pl-12">
          <button
            type="button"
            onClick={cancelEdit}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-iw-ink-500 transition-colors hover:text-iw-ink-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveEdit}
            className="rounded-full bg-iw-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-iw-violet-600 cursor-pointer"
          >
            Save
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex animate-iw-fade-in items-center gap-3 rounded-2xl border border-iw-border bg-iw-surface/60 px-3 py-2.5 transition-colors hover:border-iw-border-strong">
      <PlayerAvatar index={index} />

      <button
        type="button"
        onClick={startEdit}
        aria-label={`Edit ${player.name}`}
        className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
      >
        <span className="truncate text-sm font-semibold text-iw-ink-100">
          {player.name}
        </span>
        <Pencil
          className="h-3.5 w-3.5 shrink-0 text-iw-ink-600 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${player.name}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-iw-red/30 bg-iw-red/10 text-iw-red transition-all duration-150 hover:-translate-y-0.5 hover:bg-iw-red/20 active:translate-y-0 active:scale-95 cursor-pointer"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  );
}
