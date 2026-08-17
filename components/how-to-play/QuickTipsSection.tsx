import { Lightbulb } from "lucide-react";
import SectionCard from "./SectionCard";

const TIPS: { emoji: string; label: string; text: string }[] = [
  {
    emoji: "🎯",
    label: "Crew",
    text: "Give clues that prove you know the word without making it too obvious.",
  },
  {
    emoji: "🕵️",
    label: "Imposter",
    text: "Listen carefully and adapt to the clues other players give.",
  },
  {
    emoji: "👀",
    label: "Everyone",
    text: "Pay attention to suspicious answers, hesitation, and contradictions.",
  },
  {
    emoji: "📱",
    label: "Everyone",
    text: "Keep your secret hidden when passing the phone.",
  },
  {
    emoji: "🗣️",
    label: "Everyone",
    text: "Don't reveal the secret word during discussion unless the rules specifically allow it.",
  },
];

export default function QuickTipsSection() {
  return (
    <SectionCard icon={Lightbulb} title="Quick Tips" delayMs={540}>
      <ul className="flex flex-col gap-3">
        {TIPS.map((tip, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="text-lg leading-none" aria-hidden="true">
              {tip.emoji}
            </span>
            <p>
              <span className="font-display font-bold text-iw-ink-100">
                {tip.label}:
              </span>{" "}
              {tip.text}
            </p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
