import { WifiOff } from "lucide-react";
import SectionCard from "./SectionCard";

/**
 * Player-friendly wording only -- no mention of IndexedDB/Dexie/service
 * worker, matching components/home/OfflineAiCard.tsx and
 * components/settings/AboutCard.tsx's existing tone ("AI-powered when
 * online. Playable offline.").
 */
export default function OfflineSection() {
  return (
    <SectionCard icon={WifiOff} title="Play Offline" delayMs={500}>
      <p>
        Imposter Word is designed to keep working without an internet
        connection.
      </p>
      <p className="mt-3">
        When you&apos;re online, AI can generate new words and hints. When
        you&apos;re offline, the game uses a local word collection instead —
        either way, your game keeps going.
      </p>
      <p className="mt-3 text-sm text-iw-ink-500">
        Your game data is stored on your device.
      </p>
    </SectionCard>
  );
}
