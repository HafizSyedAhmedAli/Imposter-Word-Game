import { Lock } from "lucide-react";

/**
 * Purely decorative "something secret is being prepared" visual. Static
 * markup only -- it never has access to the word, hint, or roles, so
 * there's nothing here that could ever leak (see Screen 4 spec, section
 * 19 + 29).
 */
export default function PreparationAnimation({ ready }: { ready: boolean }) {
  return (
    <div
      className="relative flex items-center justify-center py-6"
      aria-hidden="true"
    >
      {/* Ambient glow behind the card */}
      <div
        className="absolute h-48 w-48 rounded-full blur-[70px] transition-colors duration-700"
        style={{
          background: ready
            ? "radial-gradient(circle, rgba(255,201,60,0.35), transparent 70%)"
            : "radial-gradient(circle, rgba(139,92,246,0.35), transparent 70%)",
        }}
      />

      <div className="animate-iw-float">
        <div
          className={`relative flex h-40 w-32 flex-col items-center justify-center gap-2 rounded-3xl border backdrop-blur-sm transition-colors duration-700 sm:h-44 sm:w-36 ${
            ready
              ? "border-iw-gold-500/50 bg-gradient-to-b from-iw-gold-500/20 to-iw-surface/60 animate-iw-glow-pulse"
              : "border-iw-violet-400/40 bg-gradient-to-b from-iw-violet-500/20 to-iw-surface/60"
          }`}
        >
          <span
            className={`font-display text-5xl font-bold sm:text-6xl ${
              ready ? "text-iw-gold-400" : "text-iw-violet-300"
            }`}
          >
            ?
          </span>
          <Lock
            className={`h-6 w-6 ${ready ? "text-iw-gold-400" : "text-iw-violet-300"}`}
            strokeWidth={2.5}
          />
        </div>
      </div>

      {/* Small sparkle accents flanking the card */}
      <span className="absolute -left-2 top-4 text-xl text-iw-violet-300 animate-iw-twinkle sm:-left-4">
        ✦
      </span>
      <span
        className="absolute -right-2 bottom-4 text-lg text-iw-gold-400 animate-iw-twinkle sm:-right-4"
        style={{ animationDelay: "1.4s" }}
      >
        ✦
      </span>
    </div>
  );
}
