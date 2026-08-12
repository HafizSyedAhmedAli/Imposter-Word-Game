import { Database, Sparkles } from "lucide-react";
import type { RoundContentSource } from "@/game/game-types";

const SOURCE_META: Record<
  RoundContentSource,
  { label: string; className: string; icon: React.ReactNode }
> = {
  ai: {
    label: "AI-powered round",
    className: "border-iw-gold-500/30 bg-iw-gold-500/10 text-iw-gold-400",
    icon: <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  cache: {
    label: "Cached AI round",
    className: "border-iw-violet-400/30 bg-iw-violet-500/10 text-iw-violet-300",
    icon: <Database className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  fallback: {
    label: "Offline collection",
    className: "border-iw-ink-500/30 bg-iw-surface-2 text-iw-ink-500",
    icon: <span aria-hidden="true">◌</span>,
  },
};

export default function RoundSourceIndicator({
  source,
}: {
  source: RoundContentSource | null;
}) {
  if (!source) return null;

  const meta = SOURCE_META[source];

  return (
    <div
      className={`animate-iw-fade-in flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${meta.className}`}
    >
      {meta.icon}
      {meta.label}
    </div>
  );
}
