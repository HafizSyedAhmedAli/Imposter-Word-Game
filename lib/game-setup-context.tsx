"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Category,
  Difficulty,
  GameConfig,
  GameMode,
  Player,
  TimerSettings,
} from "@/game/game-types";
import {
  DEFAULT_GAME_CONFIG,
  MAX_PLAYERS,
  validatePlayerName,
} from "@/game/game-rules";
import { generateId } from "@/lib/id";
import { shuffle } from "@/lib/shuffle";
import { getStoredGameSetup, storeGameSetup } from "@/lib/game-setup-store";

export type PlayerActionResult = { ok: true } | { ok: false; error: string };

type GameSetupContextValue = {
  config: GameConfig;
  setMode: (mode: GameMode) => void;
  setCategory: (category: Category) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setDiscussionTimer: (patch: Partial<TimerSettings>) => void;
  setVotingTimer: (patch: Partial<TimerSettings>) => void;
  resetConfig: () => void;

  players: Player[];
  addPlayer: (name: string) => PlayerActionResult;
  editPlayer: (id: string, name: string) => PlayerActionResult;
  removePlayer: (id: string) => void;
  randomizePlayers: () => void;
  resetPlayers: () => void;

  /**
   * True once the sessionStorage recovery check below has run. Screens
   * that treat an empty `players` array as a hard error (Round
   * Preparation's "no players" recovery card) should wait for this
   * before trusting `players.length === 0`, since it's `false` (not yet
   * meaningful) for one tick on every fresh mount of this provider --
   * see the doc comment on the hydration effect below.
   */
  isHydrated: boolean;
};

const GameSetupContext = createContext<GameSetupContextValue | null>(null);

/**
 * Holds the in-progress `GameConfig` while the player moves through the
 * setup flow (Setup -> Players -> ...). This is plain React state living
 * in a provider mounted in the root layout, so it survives client-side
 * navigation between routes without needing a state library, a server
 * round-trip, or URL query strings.
 *
 * Also mirrored into sessionStorage (lib/game-setup-store.ts) as a
 * safety net -- not the primary source of truth, GameSetupProvider's own
 * state is. This exists because a client-side route transition can fail
 * offline (the RSC payload fetch for the destination route has nothing
 * to succeed against) and fall back to a full browser navigation, which
 * remounts this entire provider from scratch. Without the sessionStorage
 * recovery below, that remount would silently wipe `players` back to
 * `[]` moments after someone finished adding them, surfacing Round
 * Preparation's "Let's set up the players first" card even though
 * nothing was actually wrong -- see components/round/RoundPreparationScreen.tsx's
 * `isHydrated`-gated recovery effect, which this hand-off exists to feed.
 *
 * A hard refresh (deliberately, on the same tab) still recovers via this
 * same mechanism, which is a nicer default than resetting to blank
 * defaults -- there is no legitimate scenario where silently discarding
 * a person's already-entered player list is the better outcome.
 */
export function GameSetupProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<GameConfig>(DEFAULT_GAME_CONFIG);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // null-then-hydrate: sessionStorage doesn't exist during SSR and the
  // very first client render must match the server-rendered markup
  // exactly (same convention as round-session-store.ts), so recovery
  // happens here in an effect, never in the useState initializers above.
  // Session-restore-on-mount is an accepted, pre-existing exception to
  // the "no setState in effect bodies" rule elsewhere in this codebase
  // (see RoundPreparationScreen's own sessionStorage recovery) --
  // hydrating from storage IS the synchronization this effect exists to
  // do, so there's no state-only alternative here.
  useEffect(() => {
    const stored = getStoredGameSetup();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConfig(stored.config);
      setPlayers(stored.players);
    }
    setIsHydrated(true);
  }, []);

  // Persists on every change, but only once hydration above has had a
  // chance to apply any recovered value first -- otherwise this would
  // fire on the same initial mount with the pre-hydration defaults and
  // clobber the very data the effect above just read.
  useEffect(() => {
    if (!isHydrated) return;
    storeGameSetup({ config, players });
  }, [config, players, isHydrated]);

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

  // Players (Screen 3). Kept in the same provider as `config` -- both are
  // just in-progress setup state that needs to survive client-side
  // navigation between /setup and /players without a state library.
  const addPlayer = useCallback((name: string): PlayerActionResult => {
    let result: PlayerActionResult = {
      ok: false,
      error: "Enter a player name.",
    };
    setPlayers((prev) => {
      if (prev.length >= MAX_PLAYERS) {
        result = { ok: false, error: "Maximum 12 players." };
        return prev;
      }
      const check = validatePlayerName(name, prev);
      if (!check.valid) {
        result = { ok: false, error: check.error };
        return prev;
      }
      result = { ok: true };
      return [...prev, { id: generateId(), name: check.value }];
    });
    return result;
  }, []);

  const editPlayer = useCallback(
    (id: string, name: string): PlayerActionResult => {
      let result: PlayerActionResult = {
        ok: false,
        error: "Enter a player name.",
      };
      setPlayers((prev) => {
        const check = validatePlayerName(name, prev, id);
        if (!check.valid) {
          result = { ok: false, error: check.error };
          return prev;
        }
        result = { ok: true };
        return prev.map((p) => (p.id === id ? { ...p, name: check.value } : p));
      });
      return result;
    },
    [],
  );

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Reorders the player array only -- IDs (and therefore identity) are
  // never regenerated by a shuffle. See lib/shuffle.ts.
  const randomizePlayers = useCallback(() => {
    setPlayers((prev) => shuffle(prev));
  }, []);

  const resetPlayers = useCallback(() => {
    setPlayers([]);
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
      players,
      addPlayer,
      editPlayer,
      removePlayer,
      randomizePlayers,
      resetPlayers,
      isHydrated,
    }),
    [
      config,
      setMode,
      setCategory,
      setDifficulty,
      setDiscussionTimer,
      setVotingTimer,
      resetConfig,
      players,
      addPlayer,
      editPlayer,
      removePlayer,
      randomizePlayers,
      resetPlayers,
      isHydrated,
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
