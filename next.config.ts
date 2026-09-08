import type { NextConfig } from "next";
// The build-time config helper lives at this subpath (importing it from
// the root "@sentry/nextjs" package is deprecated as of the installed
// SDK version and will be removed in its next major).
import { withSentryConfig } from "@sentry/nextjs/config";
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

// Sentry's build-time wrapper (source-map generation/upload, the
// tunnel route that avoids ad-blockers, etc.) is only applied when a
// DSN is actually configured -- with no NEXT_PUBLIC_SENTRY_DSN set,
// `next build` (and `build:mobile`) produce exactly the same output as
// before this integration, so nothing about the existing build can
// break for anyone who hasn't set up a Sentry project yet.
const sentryConfigured = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

export default sentryConfigured
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,

      // Ties uploaded source maps to the same version already used for
      // the release set in instrumentation-client.ts/sentry.server.config.ts
      // -- see this repo's package.json as the single source of truth
      // for the app version (STEP 5: no second, conflicting version
      // system).
      release: { name: version },

      // Only print source-map upload logs in CI, to keep local/Vercel
      // build output quiet.
      silent: !process.env.CI,

      // Without SENTRY_AUTH_TOKEN, the plugin skips the source-map
      // upload step and logs a warning instead of failing the build --
      // this keeps `next build`/`build:mobile` working for anyone who
      // has set a public DSN but hasn't wired up CI source-map upload
      // yet.
      authToken: process.env.SENTRY_AUTH_TOKEN,

      // Keeps the uploaded original source out of the public build
      // output -- Sentry can still show real file/line info on the
      // dashboard without shipping readable source to every visitor.
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },

      // Routes the client SDK's requests through this app's own
      // origin (avoids ad-blockers silently dropping error reports).
      // Disabled for the Capacitor build, which has no server route of
      // its own to tunnel through (see scripts/build-mobile.mjs).
      tunnelRoute: isCapacitorBuild ? undefined : "/monitoring",
    })
  : nextConfig;
