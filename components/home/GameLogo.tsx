import LogoMascot from "./LogoMascot";

export default function GameLogo() {
  return (
    <div className="flex flex-col items-center px-4 text-center">
      <LogoMascot />

      {/* 
        Note: For the exact arched effect seen in the target image, 
        you may need to export the logo text as an SVG from your design tool. 
        This CSS mimics the heavy 3D bubble style. 
      */}
      <h1
        className="mt-[-1rem] flex flex-col items-center font-display leading-[0.85] tracking-tight animate-iw-fade-up relative z-10"
        style={{ animationDelay: "80ms" }}
      >
        <span
          className="block text-[2.8rem] font-black text-white sm:text-6xl uppercase transform -rotate-2"
          style={{
            WebkitTextStroke: "2px #1a0b2e",
            textShadow: "0 6px 0 #1a0b2e, 0 8px 15px rgba(0,0,0,0.5)",
          }}
        >
          IMPOSTER
        </span>
        <span
          className="block bg-gradient-to-b from-[#ffe600] via-[#ffaa00] to-[#ff7700] bg-clip-text text-[4rem] font-black text-transparent sm:text-7xl uppercase mt-[-0.5rem] transform rotate-1"
          style={{
            WebkitTextStroke: "2px #1a0b2e",
            filter:
              "drop-shadow(0px 6px 0px #1a0b2e) drop-shadow(0px 10px 10px rgba(0,0,0,0.4))",
          }}
        >
          WORD
        </span>
      </h1>

      <p
        className="mt-4 max-w-[22rem] text-balance rounded-full border-2 border-iw-violet-500/30 bg-[#160b29]/80 px-6 py-3 text-sm leading-snug text-white backdrop-blur-md animate-iw-fade-up sm:text-base shadow-lg"
        style={{ animationDelay: "160ms" }}
      >
        The party game of secret words
        <br />
        and not-so-secret{" "}
        <span className="font-bold text-[#b764ff]">imposters!</span>
      </p>
    </div>
  );
}
