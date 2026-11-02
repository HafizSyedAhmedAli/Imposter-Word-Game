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
    <img
        src="/mascot-mask.png"
        alt=""
        className="size-16 object-contain drop-shadow-[0_10px_24px_rgba(255,196,0,0.35)]"
      />
  );
}
