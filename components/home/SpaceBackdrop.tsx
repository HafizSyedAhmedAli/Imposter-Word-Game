// Deterministic pseudo-random generator so star placement is identical
// between server and client render (avoids hydration mismatches).
function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

const rand = seededRandom(42);

const SMALL_STARS = Array.from({ length: 60 }, (_, i) => ({
  id: `s-${i}`,
  top: rand() * 100,
  left: rand() * 100,
  size: 1 + rand() * 1.6,
  delay: rand() * 3.2,
  min: 0.15 + rand() * 0.2,
  max: 0.6 + rand() * 0.4,
}));

const SPARKLE_STARS = [
  { id: "sp-1", top: 15, left: 12, size: 14, color: "var(--iw-gold-400)", delay: "0s" },
  { id: "sp-2", top: 24, left: 88, size: 11, color: "var(--iw-violet-300)", delay: "0.6s" },
  { id: "sp-3", top: 8, left: 68, size: 9, color: "var(--iw-violet-400)", delay: "1.2s" },
  { id: "sp-4", top: 42, left: 92, size: 10, color: "#7fd0ff", delay: "1.8s" },
  { id: "sp-5", top: 33, left: 6, size: 8, color: "var(--iw-violet-300)", delay: "2.2s" },
];

function Sparkle({ size, color }: { size: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M12 0 C12.8 7.5 16.5 11.2 24 12 C16.5 12.8 12.8 16.5 12 24 C11.2 16.5 7.5 12.8 0 12 C7.5 11.2 11.2 7.5 12 0 Z" />
    </svg>
  );
}

export default function SpaceBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Base gradient wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% -10%, #1c1650 0%, #0b0b2b 42%, #05051a 78%)",
        }}
      />

      {/* Nebula glows */}
      <div
        className="absolute -left-24 top-10 h-72 w-72 rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.28), transparent 70%)" }}
      />
      <div
        className="absolute -right-16 top-1/3 h-80 w-80 rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(255,77,94,0.14), transparent 70%)" }}
      />

      {/* Small twinkling stars */}
      {SMALL_STARS.map((s) => (
        <span
          key={s.id}
          className="absolute animate-iw-twinkle rounded-full bg-white"
          style={
            {
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
              "--twinkle-min": s.min,
              "--twinkle-max": s.max,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Larger sparkle accents */}
      {SPARKLE_STARS.map((s) => (
        <div
          key={s.id}
          className="absolute animate-iw-twinkle"
          style={{ top: `${s.top}%`, left: `${s.left}%`, animationDelay: s.delay }}
        >
          <Sparkle size={s.size} color={s.color} />
        </div>
      ))}

      {/* Abstract planets */}
      <div
        className="absolute -left-10 top-[10%] h-28 w-28 rounded-full opacity-90 sm:h-36 sm:w-36"
        style={{
          background: "radial-gradient(circle at 35% 30%, #a78bfa, #5b3fb0 55%, #2c1c5c 100%)",
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 h-10 w-full -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] rounded-full border border-white/25"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}
        />
      </div>
      <div
        className="absolute right-[-2.5rem] top-[26%] h-16 w-16 rounded-full opacity-80 sm:h-20 sm:w-20"
        style={{
          background: "radial-gradient(circle at 40% 35%, #7fd0ff, #2f6fb0 60%, #163a63 100%)",
        }}
      />

      {/* Vignette to keep buttons legible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(85% 60% at 50% 40%, transparent 55%, rgba(5,5,26,0.55) 100%)",
        }}
      />
    </div>
  );
}
