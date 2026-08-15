"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/use-online-status";

/**
 * Lightweight, non-blocking connectivity indicator.
 *
 * This intentionally does NOT perform any network request and does not
 * gate the Home Screen on its value -- it only reflects navigator.onLine
 * for now. Real fallback / reachability logic will live in the future
 * Round Provider, not here.
 */
export default function ConnectionStatus() {
  const online = useOnlineStatus();

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold backdrop-blur-sm transition-colors ${
        online
          ? "border-iw-online/30 bg-iw-online/10 text-iw-online"
          : "border-iw-offline/30 bg-iw-offline/10 text-iw-offline"
      }`}
      role="status"
    >
      {online ? (
        <Wifi className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <WifiOff className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
      )}
      <span>{online ? "Online" : "Offline"}</span>
      <span
        className={`ml-0.5 h-1.5 w-1.5 rounded-full ${online ? "bg-iw-online" : "bg-iw-offline"}`}
        aria-hidden="true"
      />
    </div>
  );
}
