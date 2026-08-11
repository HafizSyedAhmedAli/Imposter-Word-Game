import { Sparkles } from "lucide-react";
import type { RoundContentSource } from "@/game/game-types";

export default function RoundSourceIndicator({
  source,
}: {
  source: RoundContentSource | null;
}) {
  if (!source) return null;

  return (
    <div
      className={`animate-iw-fade-in flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        source === "ai"
          ? "border-iw-gold-500/30 bg-iw-gold-500/10 text-iw-gold-400"
          : "border-iw-ink-500/30 bg-iw-surface-2 text-iw-ink-500"
      }`}
    >
      {source === "ai" ? (
        <>
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          AI-powered round
        </>
      ) : (
        <>
          <span aria-hidden="true">◌</span>
          Offline collection
        </>
      )}
    </div>
  );
}
