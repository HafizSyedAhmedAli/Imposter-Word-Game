import type { NextConfig } from "next";
import { version } from "./package.json";

const nextConfig: NextConfig = {
  /* config options here */

  // Exposes the package.json version to the client for the Settings
  // screen's About card, without bundling the rest of package.json
  // (dependency list, scripts, etc.) into client code.
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

export default nextConfig;
