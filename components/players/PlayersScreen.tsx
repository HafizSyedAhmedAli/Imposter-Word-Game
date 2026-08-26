"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import { useGameSetup } from "@/lib/game-setup-context";
import { isPlayerCountValid, MAX_PLAYERS } from "@/game/game-rules";
import { error, light } from "@/lib/haptics";
import { playSound } from "@/lib/sound-engine";
import PlayersHeader from "./PlayersHeader";
import GameConfigSummary from "./GameConfigSummary";
import PlayerCount from "./PlayerCount";
import PlayerInput from "./PlayerInput";
import PlayerList from "./PlayerList";
import RandomizePlayersButton from "./RandomizePlayersButton";
import PlayerValidationMessage from "./PlayerValidationMessage";
import PlayersContinueButton from "./PlayersContinueButton";

export default function PlayersScreen() {
  const router = useRouter();
  const {
    config,
    players,
    addPlayer,
    editPlayer,
    removePlayer,
    randomizePlayers,
  } = useGameSetup();
  const [inputError, setInputError] = useState<string | null>(null);

  const canContinue = isPlayerCountValid(config.mode, players.length);
  const atMaxPlayers = players.length >= MAX_PLAYERS;

  function handleAddPlayer(name: string): boolean {
    const result = addPlayer(name);
    if (!result.ok) {
      setInputError(result.error);
      return false;
    }
    setInputError(null);
    return true;
  }

  function handleContinue() {
    // Player setup is complete: GameConfig + Players are ready to hand
    // off. Word/hint generation and role assignment happen on the next
    // screen (Round Preparation), not here.
    if (!canContinue) {
      playSound("ui-error");
      error();
      return;
    }
    playSound("ui-tap");
    light();
    router.push("/round");
  }

  return (
    <div className="relative flex min-h-dvh w-full justify-center">
      <SpaceBackdrop />

      <div className="flex w-full max-w-[1400px] flex-col px-4 pl-safe pr-safe pt-safe pb-safe sm:px-6 sm:py-8 lg:px-10">
        <PlayersHeader />

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 py-6 lg:max-w-3xl">
          <GameConfigSummary config={config} />

          <section
            className="animate-iw-fade-up rounded-3xl border border-iw-border bg-iw-surface/40 p-4 backdrop-blur-sm sm:p-5"
            style={{ animationDelay: "60ms" }}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold tracking-wide text-iw-ink-100 sm:text-xl">
                PLAYER LIST
              </h2>
              <RandomizePlayersButton
                onClick={randomizePlayers}
                disabled={players.length < 2}
              />
            </div>

            <div className="mt-4">
              <PlayerCount count={players.length} />
            </div>

            <div className="mt-4">
              <PlayerInput
                onAdd={handleAddPlayer}
                error={inputError}
                onClearError={() => setInputError(null)}
                disabled={atMaxPlayers}
              />
            </div>

            <div className="mt-4">
              <PlayerList
                players={players}
                onRemove={removePlayer}
                onEdit={editPlayer}
              />
            </div>
          </section>

          <PlayerValidationMessage
            mode={config.mode}
            playerCount={players.length}
          />

          <div className="mt-2 flex flex-col gap-3">
            <PlayersContinueButton
              onClick={handleContinue}
              disabled={!canContinue}
            />
            <p className="text-center text-sm text-iw-ink-600 mt-2">
              Players will receive their roles in this order.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
