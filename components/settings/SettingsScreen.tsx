"use client";

import { useCallback, useState } from "react";
import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import { resetGameData } from "@/lib/reset-game-data";
import SettingsHeader from "./SettingsHeader";
import PreferencesCard from "./PreferencesCard";
import InstallAppCard from "./InstallAppCard";
import ResetGameDataCard from "./ResetGameDataCard";
import ResetGameDataDialog from "./ResetGameDataDialog";
import AboutCard from "./AboutCard";

export type ResetStatus = "idle" | "resetting" | "success" | "error";

export default function SettingsScreen() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState<ResetStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRequestReset = useCallback(() => {
    // Re-opening the dialog after a previous attempt clears any stale
    // success/error message from last time, so the card doesn't show an
    // outdated result while a fresh confirmation is pending.
    setStatus("idle");
    setErrorMessage(null);
    setDialogOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    setDialogOpen(false);
    setStatus("resetting");
    setErrorMessage(null);

    resetGameData()
      .then(() => {
        setStatus("success");
      })
      .catch((error: unknown) => {
        // Technical detail stays in the console for debugging; the
        // person only ever sees a friendly, generic message (spec:
        // never expose raw IndexedDB/Dexie stack traces).
        console.error("Failed to reset game data:", error);
        setStatus("error");
        setErrorMessage("Couldn't reset your game data. Please try again.");
      });
  }, []);

  return (
    <div className="relative flex min-h-dvh w-full justify-center">
      <SpaceBackdrop />

      <div className="flex w-full max-w-[1400px] flex-col px-4 pl-safe pr-safe pt-safe pb-safe sm:px-6 sm:py-8 lg:px-10">
        <SettingsHeader />

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 py-6 lg:max-w-4xl">
          <PreferencesCard />
          <InstallAppCard />
          <ResetGameDataCard
            status={status}
            errorMessage={errorMessage}
            onRequestReset={handleRequestReset}
          />
          <AboutCard />
        </main>
      </div>

      {dialogOpen && (
        <ResetGameDataDialog
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
