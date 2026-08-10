"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  Category,
  Difficulty,
  GameConfig,
  GameMode,
  TimerSettings,
} from "@/game/game-types";
import { DEFAULT_GAME_CONFIG } from "@/game/game-rules";

type GameSetupContextValue = {
  config: GameConfig;
  setMode: (mode: GameMode) => void;
  setCategory: (category: Category) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setDiscussionTimer: (patch: Partial<TimerSettings>) => void;
  setVotingTimer: (patch: Partial<TimerSettings>) => void;
  resetConfig: () => void;
};

const GameSetupContext = createContext<GameSetupContextValue | null>(null);

/**
 * Holds the in-progress `GameConfig` while the player moves through the
 * setup flow (Setup -> Players -> ...). This is plain React state living
 * in a provider mounted in the root layout, so it survives client-side
 * navigation between routes without needing a state library, a server
 * round-trip, or URL query strings.
 *
 * A hard refresh intentionally resets to defaults for the MVP (see
 * DEFAULT_GAME_CONFIG) -- nothing here is persisted to disk.
 */
export function GameSetupProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<GameConfig>(DEFAULT_GAME_CONFIG);

  const setMode = useCallback((mode: GameMode) => {
    setConfig((prev) => ({ ...prev, mode }));
  }, []);

  const setCategory = useCallback((category: Category) => {
    setConfig((prev) => ({ ...prev, category }));
  }, []);

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setConfig((prev) => ({ ...prev, difficulty }));
  }, []);

  const setDiscussionTimer = useCallback((patch: Partial<TimerSettings>) => {
    setConfig((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        discussionTimer: { ...prev.options.discussionTimer, ...patch },
      },
    }));
  }, []);

  const setVotingTimer = useCallback((patch: Partial<TimerSettings>) => {
    setConfig((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        votingTimer: { ...prev.options.votingTimer, ...patch },
      },
    }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_GAME_CONFIG);
  }, []);

  const value = useMemo(
    () => ({
      config,
      setMode,
      setCategory,
      setDifficulty,
      setDiscussionTimer,
      setVotingTimer,
      resetConfig,
    }),
    [
      config,
      setMode,
      setCategory,
      setDifficulty,
      setDiscussionTimer,
      setVotingTimer,
      resetConfig,
    ],
  );

  return (
    <GameSetupContext.Provider value={value}>
      {children}
    </GameSetupContext.Provider>
  );
}

export function useGameSetup() {
  const ctx = useContext(GameSetupContext);
  if (!ctx) {
    throw new Error("useGameSetup must be used within a GameSetupProvider");
  }
  return ctx;
}
