import LogoMascot from "./LogoMascot";

export default function GameLogo() {
  return (
    <div className="flex flex-col items-center px-4 text-center">
      <LogoMascot />

      <h1
        className="mt-3 font-display leading-[0.85] tracking-tight animate-iw-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <span className="block text-[2.6rem] font-semibold text-iw-ink-100 [text-shadow:0_3px_0_rgba(0,0,0,0.35)] sm:text-6xl">
          IMPOSTER
        </span>
        <span className="block bg-gradient-to-b from-iw-gold-100 via-iw-gold-400 to-iw-gold-600 bg-clip-text text-[3.4rem] font-bold text-transparent [text-shadow:0_3px_0_rgba(0,0,0,0.2)] sm:text-7xl">
          WORD
        </span>
      </h1>

      <p
        className="mt-4 max-w-[19rem] text-balance rounded-2xl border border-iw-border bg-iw-surface/40 px-4 py-2.5 text-sm leading-snug text-iw-ink-300 backdrop-blur-sm animate-iw-fade-up sm:text-base"
        style={{ animationDelay: "160ms" }}
      >
        The party game of secret words
        <br />
        and not-so-secret <span className="font-semibold text-iw-violet-300">imposters!</span>
      </p>
    </div>
  );
}
