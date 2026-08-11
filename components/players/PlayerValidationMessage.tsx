import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { GameMode } from "@/game/game-types";
import {
  getImposterCount,
  getMinimumPlayersForMode,
  getModeDisplayName,
  getPlayerCountStatus,
} from "@/game/game-rules";

export default function PlayerValidationMessage({
  mode,
  playerCount,
}: {
  mode: GameMode;
  playerCount: number;
}) {
  const status = getPlayerCountStatus(mode, playerCount);

  if (status === "ready") {
    return (
      <div className="flex flex-col gap-1.5 animate-iw-fade-in">
        <div className="flex items-center gap-2 rounded-2xl border border-iw-online/30 bg-iw-online/10 px-4 py-3">
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-iw-online"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-iw-online">
            {playerCount} players — ready to play!
          </p>
        </div>
        {mode === "random" && (
          <p className="px-1 text-xs text-iw-ink-500">
            Imposter count will be balanced automatically based on the number of
            players.
          </p>
        )}
      </div>
    );
  }

  if (status === "empty" || status === "too-few-overall") {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-iw-offline/30 bg-iw-offline/10 px-4 py-3 animate-iw-fade-in">
        <AlertTriangle
          className="h-4 w-4 shrink-0 text-iw-offline"
          aria-hidden="true"
        />
        <p className="text-sm font-semibold text-iw-offline">
          At least 3 players are required.
        </p>
      </div>
    );
  }

  // status === "mode-requirement"
  const minForMode = getMinimumPlayersForMode(mode);
  const needed = minForMode - playerCount;
  const imposters = getImposterCount(minForMode, mode);
  const modeName = getModeDisplayName(mode);

  return (
    <div className="flex items-start gap-2 rounded-2xl border border-iw-offline/30 bg-iw-offline/10 px-4 py-3 animate-iw-fade-in">
      <AlertTriangle
        className="h-4 w-4 shrink-0 text-iw-offline"
        aria-hidden="true"
      />
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-iw-offline">
          {modeName} needs more players
        </p>
        <p className="mt-0.5 text-sm text-iw-ink-300">
          Add at least {needed} more player{needed === 1 ? "" : "s"} to play
          with {imposters} imposter{imposters === 1 ? "" : "s"}.
        </p>
      </div>
    </div>
  );
}
