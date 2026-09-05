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
            "radial-gradient(circle, rgba(255,196,0,0.35) 0%, rgba(139,92,246,0.18) 55%, transparent 75%)",
        }}
      />
      {/*
        Same mask artwork used for the app icon, splash screen, and
        favicon (see resources/icon-foreground.png / assets/icon.png) --
        kept as one shared design across every surface instead of a
        second, separately-drawn mascot.
      */}
      <img
        src="/mascot-mask.png"
        alt=""
        className="h-full w-full object-contain drop-shadow-[0_10px_24px_rgba(255,196,0,0.35)]"
      />
    </div>
  );
}