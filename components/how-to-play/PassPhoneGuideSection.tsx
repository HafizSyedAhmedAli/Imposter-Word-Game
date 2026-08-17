import { Smartphone, EyeOff } from "lucide-react";
import SectionCard from "./SectionCard";

export default function PassPhoneGuideSection() {
  return (
    <SectionCard icon={Smartphone} title="Pass the Phone" delayMs={260}>
      <p>
        Players take turns viewing their secret information. After you&apos;ve
        seen your information, pass the phone to the next player without showing
        your screen.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3 rounded-2xl border border-iw-border bg-iw-surface-2/50 px-4 py-3">
        {[
          "Player 1",
          "Secret",
          "Pass Phone",
          "Player 2",
          "Secret",
          "Pass Phone",
        ].map((label, index) => (
          <span key={`${label}-${index}`} className="flex items-center gap-2">
            <span className="rounded-full bg-iw-surface px-2.5 py-1 font-display text-xs font-bold text-iw-ink-100">
              {label}
            </span>
            {index < 5 && (
              <span className="text-iw-ink-500" aria-hidden="true">
                →
              </span>
            )}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-iw-gold-600/30 bg-iw-gold-500/10 px-4 py-3">
        <EyeOff
          className="mt-0.5 h-4 w-4 shrink-0 text-iw-gold-400"
          strokeWidth={2.25}
          aria-hidden="true"
        />
        <p className="text-sm text-iw-ink-300">
          Don&apos;t look at another player&apos;s secret. Don&apos;t let other
          players see your screen — this matters most because everyone shares
          one phone.
        </p>
      </div>
    </SectionCard>
  );
}
