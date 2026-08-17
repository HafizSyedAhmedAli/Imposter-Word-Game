import { ShieldAlert } from "lucide-react";
import SectionCard from "./SectionCard";

export default function EliminationGuideSection() {
  return (
    <SectionCard icon={ShieldAlert} title="Elimination" delayMs={380}>
      <p>
        The player with the most votes is eliminated, and their role is revealed
        to everyone — either{" "}
        <span className="font-display font-bold text-iw-red">
          Imposter Caught
        </span>{" "}
        or{" "}
        <span className="font-display font-bold text-iw-violet-300">
          Wrong Player
        </span>
        . Eliminated players sit out the rest of the round.
      </p>
      <p className="mt-3">
        If the game isn&apos;t decided yet, everyone heads back into discussion
        for another round of clues and voting among whoever&apos;s left. If it
        is decided, the game moves straight to the final results.
      </p>
    </SectionCard>
  );
}
