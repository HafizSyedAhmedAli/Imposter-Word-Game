"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  playAmbient,
  stopAmbient,
  persistAmbientContinuity,
  consumeAmbientContinuity,
} from "@/lib/sound-engine";
import { onBeforeHardNavigate } from "@/lib/offline-navigation";

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

// Fade used to resume the bed after an offline hard document reload
// between two menu screens (see the effect below) -- short enough to
// read as "it never really stopped" rather than replaying playAmbient's
// normal 600ms "welcome to the menu" fade-in from a freshly-created Howl.
const CONTINUITY_RESUME_FADE_MS = 60;

export default function MenuMusicController() {
  const pathname = usePathname();
  const wasInMenuRef = useRef(false);

  useEffect(() => {
    const isMenuRoute = MENU_ROUTES.has(pathname);

    // Always consume the flag, even on branches that don't use it, so a
    // stale "yes" from an earlier hard reload never leaks into some
    // unrelated later navigation.
    const isContinuation = consumeAmbientContinuity();

    if (isMenuRoute && !wasInMenuRef.current) {
      // Entering the menu flow from outside it. Normally that means
      // first load, or coming back after a game finishes -- but while
      // offline it's also what an ordinary menu-to-menu navigation
      // looks like, because lib/offline-navigation.ts has to fall back
      // to a real document navigation (Next's RSC-fetching client-side
      // transition can't work without a network round trip), which
      // wipes wasInMenuRef along with everything else in this module.
      // `isContinuation` tells the two apart: if the bed was already
      // playing right before this reload, resume it near-instantly
      // instead of sounding like it restarted from scratch.
      playAmbient(isContinuation ? CONTINUITY_RESUME_FADE_MS : undefined);
    } else if (!isMenuRoute && wasInMenuRef.current) {
      // Leaving the menu flow because the game is starting -- fade out
      // instead of cutting abruptly.
      stopAmbient(GAME_START_FADE_MS);
    }
    // Menu-to-menu navigation (e.g. Home -> Settings): do nothing, the
    // bed just keeps playing uninterrupted.

    wasInMenuRef.current = isMenuRoute;
  }, [pathname]);

  // Persist "the ambient bed was playing" right before any offline hard
  // navigation, so the effect above can tell a continuation apart from a
  // genuine fresh entry into the menu flow once the reload it forces
  // completes.
  useEffect(() => onBeforeHardNavigate(persistAmbientContinuity), []);

  return null;
}
