import { Sparkles } from "lucide-react";
import SectionCard from "./SectionCard";

export default function IntroSection() {
  return (
    <SectionCard icon={Sparkles} title="What is Imposter Word?" delayMs={0}>
      <p>
        Imposter Word is a social deduction word game where everyone gets secret
        information — except the Imposters.
      </p>
      <p className="mt-3">
        Most players receive the secret word. The Imposters receive a hint
        instead. Everyone then discusses the word, tries to identify the
        Imposters, and votes to eliminate them.
      </p>
    </SectionCard>
  );
}
