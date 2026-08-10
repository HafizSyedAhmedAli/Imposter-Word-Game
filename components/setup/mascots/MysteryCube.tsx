/**
 * Original mystery-cube artwork for the "Random" game mode card. A 3D-ish
 * cube rendered with three shaded faces plus a glowing question mark, in
 * the app's violet palette.
 */
export default function MysteryCube({ size = 56 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      className="drop-shadow-[0_6px_14px_rgba(139,92,246,0.45)]"
    >
      <defs>
        <linearGradient
          id="iw-cube-top"
          x1="10"
          y1="20"
          x2="90"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#cbb4ff" />
          <stop offset="100%" stopColor="#9d84ff" />
        </linearGradient>
        <linearGradient
          id="iw-cube-left"
          x1="10"
          y1="30"
          x2="50"
          y2="90"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7a52e8" />
          <stop offset="100%" stopColor="#5735b8" />
        </linearGradient>
        <linearGradient
          id="iw-cube-right"
          x1="50"
          y1="30"
          x2="90"
          y2="90"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6633d6" />
        </linearGradient>
      </defs>

      <path
        d="M50 6 L88 26 L50 46 L12 26 Z"
        fill="url(#iw-cube-top)"
        stroke="#3c2280"
        strokeWidth="2.5"
      />
      <path
        d="M12 26 L50 46 L50 90 L12 70 Z"
        fill="url(#iw-cube-left)"
        stroke="#3c2280"
        strokeWidth="2.5"
      />
      <path
        d="M88 26 L50 46 L50 90 L88 70 Z"
        fill="url(#iw-cube-right)"
        stroke="#3c2280"
        strokeWidth="2.5"
      />

      <text
        x="50"
        y="60"
        textAnchor="middle"
        fontFamily="Fredoka, ui-rounded, sans-serif"
        fontWeight="700"
        fontSize="30"
        fill="#f7f5ff"
        opacity="0.95"
      >
        ?
      </text>
    </svg>
  );
}
