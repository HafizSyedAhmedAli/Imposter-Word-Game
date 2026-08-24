import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.hafizsyedahmedali.imposterword",
  appName: "Imposter Word",
  // Points at the static export produced by scripts/build-mobile.mjs,
  // NOT the normal `next build` output -- that output still contains
  // the server-only /api route, which can't run inside a Capacitor
  // webview.
  webDir: "out",
  server: {
    // Explicit https scheme on Android (iOS ignores this and always
    // uses capacitor://) so cookies/secure-context checks (e.g. the
    // service-worker guard, Web Locks API) behave the same as they do
    // on a real deployed origin, rather than differing between
    // platforms during local testing.
    androidScheme: "https",
  },
};

export default config;
