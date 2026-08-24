import type { NextConfig } from "next";
import { version } from "./package.json";

const isCapacitorBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === "capacitor";

const nextConfig: NextConfig = {
  // Only the mobile build (see scripts/build-mobile.mjs) is a static
  // export. The normal web deploy stays a full Next server so
  // app/api/round/generate keeps working there.
  ...(isCapacitorBuild ? { output: "export" } : {}),

  // Exposes the package.json version to the client for the Settings
  // screen's About card, without bundling the rest of package.json
  // (dependency list, scripts, etc.) into client code.
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

export default nextConfig;