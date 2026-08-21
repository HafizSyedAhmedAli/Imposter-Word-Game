"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { playAmbient, stopAmbient } from "@/lib/sound-engine";

// The screens the ambient menu bed should play across. Single source
// of truth
const MENU_ROUTES = new Set<string>([
  "/",
  "/settings",
  "/how-to-play",
  "/setup",
  "/players",
  "/round",
]);

// Longer, gentler fade specifically for the moment the game actually
// starts (leaving Players for Round Preparation) -- stopAmbient()'s
// own default (400ms) is for quick, deliberate stops like toggling
// Music off in Settings; this is for a scene transition.
const GAME_START_FADE_MS = 1200;

export default function MenuMusicController() {
  const pathname = usePathname();
  const wasInMenuRef = useRef(false);

  useEffect(() => {
    const isMenuRoute = MENU_ROUTES.has(pathname);

    if (isMenuRoute && !wasInMenuRef.current) {
      // Entering the menu flow from outside it (first load, or coming
      // back after a game finishes) -- start the bed.
      playAmbient();
    } else if (!isMenuRoute && wasInMenuRef.current) {
      // Leaving the menu flow because the game is starting -- fade out
      // instead of cutting abruptly.
      stopAmbient(GAME_START_FADE_MS);
    }
    // Menu-to-menu navigation (e.g. Home -> Settings): do nothing, the
    // bed just keeps playing uninterrupted.

    wasInMenuRef.current = isMenuRoute;
  }, [pathname]);

  return null;
}
