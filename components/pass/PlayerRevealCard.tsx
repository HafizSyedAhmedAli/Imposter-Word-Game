import { EyeOff } from "lucide-react";

// IMPORTANT: this component intentionally has no `hint` prop. Crew/
// Players never see the AI-generated hint under the new role-info rule
// -- they see the word and must invent their own clue from it. Omitting
// the prop entirely (not just the render) keeps that guarantee even if
// a future edit forgets to check the rule.
export default function PlayerRevealCard({
  playerName,
  word,
  onHide,
}: {
  playerName: string;
  word: string;
  onHide: () => void;
}) {
  return (
    <section
      className="animate-iw-fade-in flex flex-col items-center gap-6 text-center"
      aria-live="polite"
    >
      <div className="w-full rounded-3xl border border-iw-online/40 bg-gradient-to-b from-iw-online/10 to-iw-surface/70 p-6 backdrop-blur-sm">
        <p className="font-display text-lg font-bold text-iw-online">
          🟢 YOU&apos;RE A PLAYER
        </p>
        <p className="mt-1 text-sm text-iw-ink-500">{playerName}</p>

        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-iw-ink-500">
          Your secret word
        </p>
        <p className="mt-1 font-display text-5xl font-bold text-iw-ink-100 break-words">
          {word}
        </p>

        <p className="mt-6 border-t border-iw-border pt-4 text-sm text-iw-ink-300">
          Give a clue without saying the word directly.
        </p>
      </div>

      <button
        type="button"
        onClick={onHide}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-iw-gold-600/40 bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-500 px-6 py-4 font-display text-base font-bold text-iw-gold-ink shadow-[0_16px_32px_-14px_rgba(255,184,0,0.6)] transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
      >
        <EyeOff className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        HIDE &amp; PASS PHONE
      </button>
    </section>
  );
}
