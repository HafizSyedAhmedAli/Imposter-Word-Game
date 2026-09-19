// lib/game-setup-context.tsx
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
  CUSTOM_CATEGORY,
  DEFAULT_GAME_CONFIG,
  MAX_PLAYERS,
  validatePlayerName,
} from "@/game/game-rules";
import { generateId } from "@/shared/lib/id";
import { rotate } from "@/shared/lib/shuffle";
import { getStoredGameSetup, storeGameSetup } from "@/lib/game-setup-store";

export type PlayerActionResult = { ok: true } | { ok: false; error: string };

type GameSetupContextValue = {
  config: GameConfig;
  setMode: (mode: GameMode) => void;
  setCategory: (category: Category) => void;
  /**
   * Sets the category to `CUSTOM_CATEGORY` and records which of the
   * player's saved custom-word categories to draw from, in one atomic
   * update -- see `GameConfig.customWordCategory`'s doc comment. Used
   * only by the Setup screen's Custom Words toggle
   * (components/setup/CategorySelector.tsx); every other category
   * selection goes through `setCategory` above instead.
   */
  selectCustomWordCategory: (category: Category) => void;
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
   * Whether the Players screen's randomize toggle is on. Lives here
   * (not as local state in PlayersScreen) because it needs to survive
   * PlayersScreen unmounting for a full round and remounting afterwards
   * (Results -> Final Results -> "Play Again" all route back through
   * `/players`) -- GameSetupProvider is the one thing in this flow that
   * stays mounted the whole time. PlayersScreen reads this on mount to
   * decide whether to auto-rotate for the new round.
   */
  randomizeEnabled: boolean;
  setRandomizeEnabled: (enabled: boolean) => void;

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
  const [randomizeEnabled, setRandomizeEnabled] = useState(false);
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
      // `?? false` covers a session stored before `randomizeEnabled`
      // existed, where the field is simply absent from the parsed JSON.
      setRandomizeEnabled(stored.randomizeEnabled ?? false);
    }
    setIsHydrated(true);
  }, []);

  // Persists on every change, but only once hydration above has had a
  // chance to apply any recovered value first -- otherwise this would
  // fire on the same initial mount with the pre-hydration defaults and
  // clobber the very data the effect above just read.
  useEffect(() => {
    if (!isHydrated) return;
    storeGameSetup({ config, players, randomizeEnabled });
  }, [config, players, randomizeEnabled, isHydrated]);

  const setMode = useCallback((mode: GameMode) => {
    setConfig((prev) => ({ ...prev, mode }));
  }, []);

  const setCategory = useCallback((category: Category) => {
    // Any selection made through the normal category row/"More" sheet
    // means the player has left Custom Words mode -- always clear a
    // stale `customWordCategory` here so it can never linger onto a
    // later `CUSTOM_CATEGORY` selection it wasn't actually chosen for.
    setConfig((prev) => ({ ...prev, category, customWordCategory: undefined }));
  }, []);

  const selectCustomWordCategory = useCallback((category: Category) => {
    setConfig((prev) => ({
      ...prev,
      category: CUSTOM_CATEGORY,
      customWordCategory: category,
    }));
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
  // never regenerated. Rotates the list by a random offset, circular-list
  // style (relative order is preserved, only where the list "starts"
  // changes) instead of a full random shuffle -- see lib/shuffle.ts's
  // `rotate`. Called both by the Players screen's toggle (immediately,
  // on an off -> on flip) and by PlayersScreen's mount effect (when the
  // toggle is already on and a new round has just started).
  const randomizePlayers = useCallback(() => {
    setPlayers((prev) => rotate(prev));
  }, []);

  const resetPlayers = useCallback(() => {
    setPlayers([]);
  }, []);

  const value = useMemo(
    () => ({
      config,
      setMode,
      setCategory,
      selectCustomWordCategory,
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
      randomizeEnabled,
      setRandomizeEnabled,
      isHydrated,
    }),
    [
      config,
      setMode,
      setCategory,
      selectCustomWordCategory,
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
      randomizeEnabled,
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
