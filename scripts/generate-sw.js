// Regenerates public/sw.js from public/sw-template.js with a fresh
// CACHE_VERSION, so every `next dev` / `next build` run gets a service
// worker that will clean up the previous version's caches on activate.
//
// public/sw.js is a build artifact (gitignored) -- edit sw-template.js
// instead. This intentionally has zero dependencies so it never risks
// conflicting with Next.js's bundler (webpack or Turbopack).

const fs = require("fs");
const path = require("path");

const templatePath = path.join(__dirname, "..", "public", "sw-template.js");
const outputPath = path.join(__dirname, "..", "public", "sw.js");

const pkg = require(path.join(__dirname, "..", "package.json"));

// Version = package.json version + a build timestamp, so both manual
// version bumps and every plain rebuild produce a distinct cache
// namespace (old caches get swept on the next activate).
const cacheVersion = `${pkg.version}-${Date.now()}`;

const template = fs.readFileSync(templatePath, "utf8");
const output = template.replace("__CACHE_VERSION__", cacheVersion);

fs.writeFileSync(outputPath, output, "utf8");

console.log(
  `[generate-sw] public/sw.js written with CACHE_VERSION=${cacheVersion}`,
);
