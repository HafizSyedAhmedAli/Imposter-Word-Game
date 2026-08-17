import { Users } from "lucide-react";
import SectionCard from "./SectionCard";

export default function MultipleImpostersSection() {
  return (
    <SectionCard
      icon={Users}
      title="Playing With Multiple Imposters"
      delayMs={420}
    >
      <p>
        Depending on the selected game mode, a round can have 1, 2, or 3
        Imposters. With 3 Imposters, three players receive hints instead of the
        secret word.
      </p>
      <p className="mt-3">
        For example: 10 players with Triple Threat mode means 7 Crew and 3
        Imposters.
      </p>
      <p className="mt-3 rounded-2xl border border-iw-border bg-iw-surface-2/50 px-4 py-3 text-sm text-iw-ink-300">
        Imposters don&apos;t know who the other Imposters are — everyone has to
        work it out from the discussion, same as the Crew.
      </p>
    </SectionCard>
  );
}
