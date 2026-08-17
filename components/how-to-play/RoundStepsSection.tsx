import { ListOrdered } from "lucide-react";
import SectionCard from "./SectionCard";

const STEPS: { title: string; description: string }[] = [
  {
    title: "Game Setup",
    description:
      "Choose your game mode (how many Imposters), category, and difficulty.",
  },
  {
    title: "Players",
    description: "Enter the names of everyone playing.",
  },
  {
    title: "Secret Reveal",
    description:
      "Players privately view their secret information one at a time.",
  },
  {
    title: "Pass the Phone",
    description:
      "Pass the phone to the next player without revealing your secret.",
  },
  {
    title: "Discussion",
    description:
      "Everyone discusses the possible word and looks for suspicious behavior.",
  },
  {
    title: "Voting",
    description: "Vote for the player you think is an Imposter.",
  },
  {
    title: "Elimination",
    description:
      "The most-voted player is eliminated and their role is revealed.",
  },
  {
    title: "Results",
    description:
      "The round continues if the game isn't decided yet, or reveals the final outcome.",
  },
];

export default function RoundStepsSection() {
  return (
    <SectionCard icon={ListOrdered} title="How a Round Works" delayMs={120}>
      <ol className="flex flex-col gap-0">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative flex gap-3 pb-5 last:pb-0">
            {index < STEPS.length - 1 && (
              <span
                className="absolute top-8 left-[15px] h-full w-px bg-iw-border"
                aria-hidden="true"
              />
            )}
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-iw-violet-500/20 font-display text-sm font-bold text-iw-violet-300"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="font-display text-sm font-bold text-iw-ink-100">
                {step.title}
              </p>
              <p className="mt-0.5 text-sm text-iw-ink-500">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
