/**
 * A compact version of the home screen's mascot silhouette, used on the
 * Game Mode cards. Kept intentionally simple (no cape, no "shh" hand) so
 * multiple copies can sit side-by-side to represent imposter count without
 * feeling cluttered.
 */
export default function ImposterMiniMascot({
  size = 56,
  uid,
}: {
  size?: number;
  /** Unique id so gradient defs don't collide when several mascots render at once. */
  uid: string;
}) {
  const bodyId = `iw-mini-body-${uid}`;
  const visorId = `iw-mini-visor-${uid}`;

  return (
    <svg
      viewBox="0 0 100 110"
      width={size}
      height={size * 1.1}
      aria-hidden="true"
      className="drop-shadow-[0_6px_12px_rgba(255,77,94,0.35)]"
    >
      <defs>
        <linearGradient
          id={bodyId}
          x1="15"
          y1="5"
          x2="85"
          y2="105"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ff6b78" />
          <stop offset="55%" stopColor="#ff4d5e" />
          <stop offset="100%" stopColor="#c22436" />
        </linearGradient>
        <linearGradient
          id={visorId}
          x1="28"
          y1="26"
          x2="72"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#dff4ff" />
          <stop offset="55%" stopColor="#8ec9f0" />
          <stop offset="100%" stopColor="#4f8fc9" />
        </linearGradient>
      </defs>

      <path
        d="M50 4
           C 73 4 87 21 89 44
           C 90.5 66 82.5 86 66 99
           Q 50 108 34 99
           C 17.5 86 9.5 66 11 44
           C 13 21 27 4 50 4 Z"
        fill={`url(#${bodyId})`}
        stroke="#3a0a12"
        strokeWidth="3"
      />
      <rect
        x="26"
        y="26"
        width="48"
        height="28"
        rx="13"
        fill={`url(#${visorId})`}
        stroke="#1c3b52"
        strokeWidth="2"
      />
      <path
        d="M32 31 C 37 29 45 28 50 28.5"
        stroke="#f4fbff"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.75"
        fill="none"
      />
      <ellipse cx="50" cy="102" rx="23" ry="4" fill="#000" opacity="0.25" />
    </svg>
  );
}
