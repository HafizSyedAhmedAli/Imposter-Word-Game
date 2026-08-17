/**
 * Example visual deliberately mirrors components/pass/PlayerRevealCard.tsx
 * (same colors, badge, and word treatment) so it looks like an actual
 * preview of that screen rather than a reinvented mockup. Not built on
 * SectionCard -- this needs the role-colored card treatment, not the
 * generic violet one.
 */
export default function CrewGuideCard() {
  return (
    <section
      className="animate-iw-fade-up rounded-3xl border border-iw-online/40 bg-gradient-to-b from-iw-online/10 to-iw-surface/70 p-4 backdrop-blur-sm sm:p-5"
      style={{ animationDelay: "180ms" }}
      aria-labelledby="htp-crew"
    >
      <h2
        id="htp-crew"
        className="font-display text-lg font-semibold tracking-wide text-iw-online sm:text-xl"
      >
        If You&apos;re Crew
      </h2>
      <p className="mt-1 text-sm text-iw-ink-300">
        You will see the actual secret word.
      </p>

      <div className="mt-4 rounded-2xl border border-iw-online/30 bg-iw-surface-2/50 p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
          Your secret word
        </p>
        <p className="mt-1 font-display text-3xl font-bold text-iw-ink-100">
          PIZZA
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-2 text-sm text-iw-ink-300">
        {[
          "Remember the word.",
          "Don't show it to anyone.",
          "Give useful but not overly obvious clues during discussion.",
          "Pay attention to players who seem confused or suspicious.",
          "Work together with the other Crew players.",
        ].map((tip) => (
          <li key={tip} className="flex items-start gap-2">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-iw-online"
              aria-hidden="true"
            />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
