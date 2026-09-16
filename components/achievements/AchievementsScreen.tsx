"use client";

import { useEffect, useMemo, useState } from "react";
import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import AchievementsHeader from "./AchievementsHeader";
import AchievementPlayerSelector from "./AchievementPlayerSelector";
import AchievementCategorySection from "./AchievementCategorySection";
import AchievementsEmptyState from "./AchievementsEmptyState";
import {
  getAchievementsSnapshot,
  type AchievementsSnapshot,
} from "@/lib/achievements/store";
import {
  evaluateAchievementsForPlayer,
  type AchievementState,
} from "@/lib/achievements/engine";
import type { AchievementCategory } from "@/lib/achievements/definitions";
import { captureError } from "@/lib/monitoring";

const CATEGORY_ORDER: AchievementCategory[] = [
  "getting-started",
  "crew",
  "imposter",
  "special",
];

/**
 * The Achievements screen (Home -> ACHIEVEMENTS). Loads its snapshot
 * once on mount straight from IndexedDB (lib/achievements/store.ts) --
 * fully available offline, same as Statistics. `snapshot === null` is
 * the loading state; `snapshot.players.length === 0` (no local player
 * has completed a game yet) renders the empty state instead of a
 * player selector with nothing to select.
 *
 * Achievements are always shown for exactly one selected local player
 * at a time (spec section 5: pass-the-phone, per-player progress) --
 * see AchievementPlayerSelector.
 */
export default function AchievementsScreen() {
  const [snapshot, setSnapshot] = useState<AchievementsSnapshot | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAchievementsSnapshot()
      .then((result) => {
        if (cancelled) return;
        setSnapshot(result);
        setSelectedName(result.players[0]?.normalizedName ?? null);
      })
      .catch((error: unknown) => {
        captureError(error, { phase: "load-achievements" });
        if (!cancelled) {
          setSnapshot({ players: [], unlocksById: new Map() });
          setSelectedName(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPlayer = useMemo(
    () =>
      snapshot?.players.find((p) => p.normalizedName === selectedName) ?? null,
    [snapshot, selectedName],
  );

  const statesByCategory = useMemo(() => {
    if (!selectedPlayer) return null;
    const states = evaluateAchievementsForPlayer(selectedPlayer);
    const grouped = new Map<AchievementCategory, AchievementState[]>();
    for (const state of states) {
      const existing = grouped.get(state.definition.category) ?? [];
      existing.push(state);
      grouped.set(state.definition.category, existing);
    }
    return grouped;
  }, [selectedPlayer]);

  return (
    <div className="relative flex min-h-dvh w-full justify-center">
      <SpaceBackdrop />

      <div className="flex w-full max-w-[1400px] flex-col px-4 pl-safe pr-safe pt-safe pb-safe sm:px-6 sm:py-8 lg:px-10">
        <AchievementsHeader />

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 py-6 lg:max-w-4xl">
          {snapshot === null ? (
            <div
              className="h-40 animate-pulse rounded-3xl border border-iw-border bg-iw-surface/40"
              aria-hidden="true"
            />
          ) : snapshot.players.length === 0 ? (
            <AchievementsEmptyState />
          ) : (
            <>
              <AchievementPlayerSelector
                players={snapshot.players}
                selectedName={
                  selectedName ?? snapshot.players[0].normalizedName
                }
                onSelect={setSelectedName}
              />

              {selectedPlayer &&
                statesByCategory &&
                CATEGORY_ORDER.map((category, index) => (
                  <AchievementCategorySection
                    key={category}
                    category={category}
                    states={statesByCategory.get(category) ?? []}
                    unlocksById={snapshot.unlocksById}
                    normalizedName={selectedPlayer.normalizedName}
                    animationDelay={`${index * 80}ms`}
                  />
                ))}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
