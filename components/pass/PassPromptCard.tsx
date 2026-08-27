import { Lock, Smartphone } from "lucide-react";
import type { Player } from "@/game/game-types";
import PlayerAvatar from "@/components/players/PlayerAvatar";

export default function PassPromptCard({
  currentPlayer,
  currentPlayerIndex,
  players,
  onReady,
}: {
  currentPlayer: Player;
  currentPlayerIndex: number;
  players: Player[];
  onReady: () => void;
}) {
  return (
    <section className="animate-iw-fade-up flex flex-col items-center gap-6 text-center">
      <div className="animate-iw-float flex h-20 w-20 items-center justify-center rounded-full border border-iw-violet-400/40 bg-gradient-to-b from-iw-violet-500/25 to-iw-surface/60">
        <Smartphone
          className="h-9 w-9 text-iw-violet-300"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      <div>
        <p className="font-display text-2xl font-bold text-iw-ink-100">
          PASS THE PHONE
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
          Pass the phone to
        </p>
        <p className="mt-1 font-display text-5xl font-bold text-iw-violet-300">
          {currentPlayer.name}
        </p>
      </div>

      <div className="flex w-full items-start gap-3 rounded-3xl border border-iw-border bg-iw-surface/60 p-4 text-left backdrop-blur-sm">
        <Lock
          className="mt-0.5 h-5 w-5 shrink-0 text-iw-violet-300"
          strokeWidth={2.5}
          aria-hidden="true"
        />
        <div>
          <p className="font-display text-sm font-bold text-iw-ink-100">
            KEEP IT SECRET
          </p>
          <p className="mt-0.5 text-sm text-iw-ink-500">
            Make sure only {currentPlayer.name} is looking at the screen.
          </p>
        </div>
      </div>

      {/* Turn order only -- names and colors, never roles (spec section 74) */}
      <div className="w-full">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
          Player order
        </p>
        <div className="w-full overflow-x-auto overscroll-x-contain p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-start gap-2">
            {players.map((player, index) => (
              <div key={player.id} className="flex shrink-0 items-start gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`rounded-full ${
                      index === currentPlayerIndex
                        ? "ring-2 ring-iw-gold-400 ring-offset-2 ring-offset-iw-void"
                        : "opacity-40"
                    }`}
                  >
                    <PlayerAvatar index={index} />
                  </div>
                  <span
                    className={`max-w-[64px] truncate text-[11px] font-semibold ${
                      index === currentPlayerIndex
                        ? "text-iw-ink-100"
                        : "text-iw-ink-600"
                    }`}
                  >
                    {player.name}
                  </span>
                </div>
                {index < players.length - 1 && (
                  <span className="mt-3 text-iw-ink-600" aria-hidden="true">
                    &rsaquo;
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onReady}
        className="w-full cursor-pointer rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
      >
        I&apos;M READY
      </button>
    </section>
  );
}
