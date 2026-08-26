"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import { useGameSetup } from "@/lib/game-setup-context";
import { validateGameConfig } from "@/game/game-rules";
import SetupHeader from "./SetupHeader";
import SetupSection from "./SetupSection";
import GameModeSelector from "./GameModeSelector";
import CategorySelector from "./CategorySelector";
import DifficultySelector from "./DifficultySelector";
import GameOptions from "./GameOptions";
import ContinueButton from "./ContinueButton";
import PrivacyNotice from "./PrivacyNotice";
import { light } from "@/lib/haptics";
import { playSound } from "@/lib/sound-engine";

export default function GameSetupScreen() {
  const router = useRouter();
  const {
    config,
    setMode,
    setCategory,
    setDifficulty,
    setDiscussionTimer,
    setVotingTimer,
  } = useGameSetup();
  const [error, setError] = useState<string | null>(null);

  function handleContinue() {
    // Configuration-only validation. Player-count-dependent checks (like
    // whether Triple Threat makes sense) happen on the Players screen,
    // since the player list doesn't exist yet.
    const result = validateGameConfig(config);
    if (!result.valid) {
      setError(result.errors[0]);
      return;
    }
    setError(null);
    playSound("ui-tap");
    light();
    router.push("/players");
  }

  return (
    <div className="relative flex min-h-dvh w-full justify-center">
      <SpaceBackdrop />

      <div className="flex w-full max-w-[1400px] flex-col px-4 pl-safe pr-safe pt-safe pb-safe sm:px-6 sm:py-8 lg:px-10">
        <SetupHeader />

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 py-6 lg:max-w-4xl">
          <SetupSection
            title="1. CHOOSE GAME MODE"
            description="Select how many imposters will be in the game."
            delay="40ms"
          >
            <GameModeSelector mode={config.mode} onChange={setMode} />
          </SetupSection>

          <CategorySelector category={config.category} onChange={setCategory} />

          <SetupSection title="3. CHOOSE DIFFICULTY" delay="120ms">
            <DifficultySelector
              difficulty={config.difficulty}
              onChange={setDifficulty}
            />
          </SetupSection>

          <SetupSection title="4. GAME OPTIONS" delay="160ms">
            <GameOptions
              options={config.options}
              onDiscussionChange={setDiscussionTimer}
              onVotingChange={setVotingTimer}
            />
          </SetupSection>

          <div className="mt-2 flex flex-col gap-3">
            {error && (
              <p
                role="alert"
                className="text-center text-sm font-semibold text-iw-red"
              >
                {error}
              </p>
            )}
            <ContinueButton onClick={handleContinue} />
            <PrivacyNotice />
          </div>
        </main>
      </div>
    </div>
  );
}
