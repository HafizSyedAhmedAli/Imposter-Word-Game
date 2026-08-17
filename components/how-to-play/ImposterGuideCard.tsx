/**
 * Example visual deliberately mirrors components/pass/ImposterRevealCard.tsx
 * (same colors, badge, and hint treatment) for the same reason
 * CrewGuideCard.tsx mirrors PlayerRevealCard.tsx.
 */
export default function ImposterGuideCard() {
  return (
    <section
      className="animate-iw-fade-up rounded-3xl border border-iw-red/40 bg-gradient-to-b from-iw-red/10 to-iw-surface/70 p-4 backdrop-blur-sm sm:p-5"
      style={{ animationDelay: "220ms" }}
      aria-labelledby="htp-imposter"
    >
      <h2
        id="htp-imposter"
        className="font-display text-lg font-semibold tracking-wide text-iw-red sm:text-xl"
      >
        If You&apos;re the Imposter
      </h2>
      <p className="mt-1 text-sm text-iw-ink-300">
        You will NOT see the secret word. Instead, you&apos;ll receive a hint.
      </p>

      <div className="mt-4 rounded-2xl border border-iw-red/30 bg-iw-surface-2/50 p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
          Hint
        </p>
        <p className="mt-1 text-base text-iw-ink-300">
          A popular Italian dish often topped with cheese and tomato sauce.
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-2 text-sm text-iw-ink-300">
        {[
          "Read your hint carefully.",
          "Try to work out the secret word.",
          "Listen carefully to what other players say.",
          "Give answers that fit the discussion without being too specific.",
          "Avoid drawing attention to yourself.",
          "Try to identify the secret word before you're eliminated.",
        ].map((tip) => (
          <li key={tip} className="flex items-start gap-2">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-iw-red"
              aria-hidden="true"
            />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
