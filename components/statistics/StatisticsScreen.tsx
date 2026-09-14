"use client";

import { useEffect, useState } from "react";
import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import StatisticsHeader from "./StatisticsHeader";
import StatisticsOverviewCard from "./StatisticsOverviewCard";
import GameplayStatsCard from "./GameplayStatsCard";
import MostPlayedCard from "./MostPlayedCard";
import PlayerStatsList from "./PlayerStatsList";
import StatisticsEmptyState from "./StatisticsEmptyState";
import { getStatisticsSnapshot } from "@/lib/game-statistics-store";
import {
  EMPTY_GLOBAL_STATISTICS,
  type GlobalStatistics,
  type PlayerStatistics,
} from "@/lib/statistics-aggregation";
import { captureError } from "@/lib/monitoring";

type Snapshot = {
  global: GlobalStatistics;
  players: PlayerStatistics[];
};

/**
 * The Statistics screen (Home -> STATISTICS). Loads its snapshot once on
 * mount straight from IndexedDB (lib/game-statistics-store.ts) -- fully
 * available offline, same as every other screen reading local data
 * (Custom Words, Settings). `snapshot === null` is the loading state;
 * once loaded, `gamesPlayed === 0` renders the empty state instead of a
 * screen full of real zeros dressed up as data.
 */
export default function StatisticsScreen() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStatisticsSnapshot()
      .then((result) => {
        if (!cancelled) setSnapshot(result);
      })
      .catch((error: unknown) => {
        captureError(error, { phase: "load-statistics" });
        if (!cancelled) {
          setSnapshot({ global: EMPTY_GLOBAL_STATISTICS, players: [] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative flex min-h-dvh w-full justify-center">
      <SpaceBackdrop />

      <div className="flex w-full max-w-[1400px] flex-col px-4 pl-safe pr-safe pt-safe pb-safe sm:px-6 sm:py-8 lg:px-10">
        <StatisticsHeader />

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 py-6 lg:max-w-4xl">
          {snapshot === null ? (
            <div
              className="h-40 animate-pulse rounded-3xl border border-iw-border bg-iw-surface/40"
              aria-hidden="true"
            />
          ) : snapshot.global.gamesPlayed === 0 ? (
            <StatisticsEmptyState />
          ) : (
            <>
              <StatisticsOverviewCard stats={snapshot.global} />
              <GameplayStatsCard stats={snapshot.global} />
              <MostPlayedCard stats={snapshot.global} />
              {snapshot.players.length > 0 && (
                <PlayerStatsList players={snapshot.players} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
