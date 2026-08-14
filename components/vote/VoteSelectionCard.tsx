import { Check } from "lucide-react";
import type { Player } from "@/game/game-types";
import PlayerAvatar from "@/components/players/PlayerAvatar";

/**
 * One selectable ballot row. Reuses the same selected-state treatment as
 * `components/setup/GameModeCard.tsx` (violet ring + check badge) so
 * this private screen still feels like it belongs to the rest of the
 * app, per spec's "Visual Design" section.
 */
function VoteOption({
  player,
  index,
  selected,
  onSelect,
}: {
  player: Player;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-150 ${
        selected
          ? "border-iw-violet-400 bg-iw-violet-500/15 shadow-[0_0_0_1px_rgba(139,92,246,0.4),0_0_24px_-4px_rgba(139,92,246,0.55)]"
          : "border-iw-border bg-iw-surface/60 hover:-translate-y-0.5 hover:border-iw-border-strong hover:bg-iw-surface-2"
      }`}
    >
      <PlayerAvatar index={index} />
      <span className="flex-1 font-display text-base font-semibold text-iw-ink-100">
        {player.name}
      </span>
      {selected && (
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-iw-violet-500 text-white shadow-[0_2px_8px_-1px_rgba(139,92,246,0.7)] animate-iw-fade-in"
          aria-hidden="true"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

export default function VoteSelectionCard({
  voterName,
  eligibleTargets,
  playerIndexById,
  selectedTargetId,
  onSelect,
  onCastVote,
}: {
  voterName: string;
  /**
   * Deliberately only ever the *eligible* targets (self already
   * filtered out by game/vote-flow.ts's `getEligibleVoteTargets`) --
   * this component has no self-vote guard of its own to bypass, because
   * the voter's own name is never even in this list (spec section 12).
   */
  eligibleTargets: Player[];
  /** Stable avatar color per seat -- keyed off the full player list, not this filtered one. */
  playerIndexById: Map<string, number>;
  selectedTargetId: string | null;
  onSelect: (playerId: string) => void;
  onCastVote: () => void;
}) {
  return (
    <section className="animate-iw-fade-up flex flex-col items-center gap-6 text-center">
      <div>
        <p className="font-display text-2xl font-bold text-iw-ink-100">
          WHO IS THE IMPOSTER?
        </p>
        <p className="mt-2 text-sm text-iw-ink-500">
          {voterName}, choose the player you think is the imposter.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Choose who you suspect is the imposter"
        className="flex w-full flex-col gap-2"
      >
        {eligibleTargets.map((player) => (
          <VoteOption
            key={player.id}
            player={player}
            index={playerIndexById.get(player.id) ?? 0}
            selected={selectedTargetId === player.id}
            onSelect={() => onSelect(player.id)}
          />
        ))}
      </div>

      <button
        type="button"
        disabled={!selectedTargetId}
        onClick={onCastVote}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 ease-out enabled:cursor-pointer enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        CAST VOTE
      </button>
    </section>
  );
}
