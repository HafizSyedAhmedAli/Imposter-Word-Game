export default function LogoMascot() {
  return (
    <div
      className="relative mx-auto h-28 w-28 animate-iw-float sm:h-32 sm:w-32"
      aria-hidden="true"
    >
      {/* Soft glow behind the mascot */}
      <div
        className="absolute inset-0 -z-10 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,77,94,0.35) 0%, rgba(139,92,246,0.18) 55%, transparent 75%)",
        }}
      />
      <svg
        viewBox="0 0 200 220"
        className="h-full w-full drop-shadow-[0_10px_24px_rgba(255,77,94,0.35)]"
      >
        <defs>
          <linearGradient id="iwBody" x1="30" y1="10" x2="170" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff6b78" />
            <stop offset="55%" stopColor="#ff4d5e" />
            <stop offset="100%" stopColor="#c22436" />
          </linearGradient>
          <linearGradient id="iwVisor" x1="55" y1="55" x2="145" y2="112" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#dff4ff" />
            <stop offset="55%" stopColor="#8ec9f0" />
            <stop offset="100%" stopColor="#4f8fc9" />
          </linearGradient>
          <linearGradient id="iwCape" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9b1f30" />
            <stop offset="100%" stopColor="#6f1522" />
          </linearGradient>
        </defs>

        {/* Cloak collar peeking from behind shoulders -- deliberately distinct silhouette */}
        <path d="M38 78 C20 92 14 118 24 146 C30 132 40 118 52 108 Z" fill="url(#iwCape)" />
        <path d="M162 78 C180 92 186 118 176 146 C170 132 160 118 148 108 Z" fill="url(#iwCape)" />

        {/* Body: rounded shield/drop silhouette, original proportions */}
        <path
          d="M100 8
             C 146 8 174 42 178 88
             C 181 132 165 172 132 198
             Q 100 216 68 198
             C 35 172 19 132 22 88
             C 26 42 54 8 100 8 Z"
          fill="url(#iwBody)"
          stroke="#3a0a12"
          strokeWidth="4"
        />

        {/* Visor */}
        <rect x="52" y="52" width="96" height="56" rx="26" fill="url(#iwVisor)" stroke="#1c3b52" strokeWidth="3" />
        <path d="M64 62 C74 58 90 56 100 57" stroke="#f4fbff" strokeWidth="6" strokeLinecap="round" opacity="0.75" fill="none" />

        {/* Shh hand: mitten + raised finger in front of the visor */}
        {/* <g>
          <ellipse cx="123" cy="118" rx="20" ry="24" fill="url(#iwBody)" stroke="#3a0a12" strokeWidth="3.5" />
          <rect x="112" y="70" width="15" height="42" rx="7.5" fill="url(#iwBody)" stroke="#3a0a12" strokeWidth="3.5" />
        </g> */}

        {/* Ground shadow */}
        <ellipse cx="100" cy="204" rx="46" ry="8" fill="#000" opacity="0.28" />
      </svg>
    </div>
  );
}
