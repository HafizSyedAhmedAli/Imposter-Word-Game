// scripts/build-mobile.mjs
//
// Produces the static bundle Capacitor wraps (capacitor.config.ts's
// webDir: "out"). Next's `output: "export"` mode cannot contain a
// server Route Handler (app/api/round/generate uses GEMINI_API_KEY and
// makes an outbound fetch -- neither of those can exist in a
// filesystem bundle shipped inside an app binary). So this script:
//
//   1. Temporarily renames app/api out of the app directory
//   2. Runs `next build` with NEXT_PUBLIC_BUILD_TARGET=capacitor and
//      output export forced via next.config.ts
//   3. Restores app/api, whether the build succeeded or not
//
// The exported client code still needs a working AI round-generation
// endpoint -- that's supplied via NEXT_PUBLIC_API_BASE_URL (see .env),
// which must point at your deployed instance of this same app (the one
// that still runs `next build`/`next start` normally, keeping the
// route and the secret key server-side there).
import { existsSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const apiDir = path.join(root, "app", "api");
const apiDirHidden = path.join(root, "app", "_api-disabled-for-mobile-build");

if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.error(
    "\n[build:mobile] NEXT_PUBLIC_API_BASE_URL is not set.\n" +
      "The native app has no server of its own -- it needs the absolute " +
      "URL of your deployed web instance to reach /api/round/generate.\n" +
      "Example: NEXT_PUBLIC_API_BASE_URL=https://imposterword.vercel.app\n",
  );
  process.exit(1);
}

let moved = false;
if (existsSync(apiDir)) {
  renameSync(apiDir, apiDirHidden);
  moved = true;
}

try {
  const result = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_BUILD_TARGET: "capacitor",
    },
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
} finally {
  if (moved) {
    renameSync(apiDirHidden, apiDir);
  }
}