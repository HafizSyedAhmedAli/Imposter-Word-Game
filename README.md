# Imposter Word Game

A pass-the-phone social deduction party game. Most players get a secret word
one "imposter" doesn't. Everyone discusses, votes, and tries to catch the
imposter before they catch on.

Built as a Next.js PWA, packaged for Android via Capacitor.

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **Local storage:** Dexie (IndexedDB) for game state, statistics, achievements
- **Audio:** Howler.js
- **Mobile:** Capacitor 8 (Android)
- **AI word generation:** Google Gemini API (server-side only, via `/api/round/generate`)
- **Analytics:** PostHog (optional — no-op if unconfigured)
- **Crash reporting:** Sentry (optional — no-op if unconfigured)
- **Testing:** Vitest (unit), Playwright (e2e)

## How it works

- The game runs entirely offline-first: player names, settings, statistics,
  and cached words are stored locally on-device (IndexedDB via Dexie) and
  never leave the device.
- Word/hint generation for a round calls a server route
  (`app/api/round/generate/route.ts`) which forwards a request to Gemini. If
  that call fails for any reason, the app falls back to a large built-in
  local word list (`lib/fallback-words/`) — so a network failure or API
  outage never blocks gameplay.
- Supports English and Roman Urdu hint generation.
- Supports "Custom Words" — a player-supplied secret word with an
  AI-or-fallback-generated hint.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Environment variables

Copy `.env.example` to `.env.local` and fill in what you need:

```bash
# Required for AI-generated words/hints. Without it, the app runs entirely
# on the local fallback word list (still fully playable).
GEMINI_API_KEY=

# Optional. PostHog product analytics — stays fully disabled if unset.
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Optional. Sentry crash/error reporting — stays fully disabled if unset.
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0
```

If you enable PostHog and/or Sentry in production, make sure your `/privacy`
page and Play Console Data Safety form disclose them — see
`components/privacy/PrivacyPolicyScreen.tsx`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (web) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run emit` | TypeScript type-check (no output) |
| `npm run test` | Vitest, watch mode |
| `npm run test:run` | Vitest, single run |
| `npm run test:ui` | Vitest with UI |
| `npm run test:e2e` | Playwright e2e tests |
| `npm run test:e2e:local` | Playwright, Chromium only |
| `npm run build:mobile` | Static export for Capacitor (uses `.env.mobile`) |
| `npm run cap:sync` | Build mobile + `npx cap sync` |
| `npm run open:android` | Open the Android project in Android Studio |
| `npm run cap:assets:android` | Regenerate Android icons/splash from `assets/` |
| `npm run release:local` | Full local gate: lint, type-check, build, unit + e2e tests, sync, open Android Studio |

## Project structure

```
app/            Next.js App Router pages (game screens, /privacy, API routes)
components/     UI components, grouped by screen/feature
game/           Core game logic (engine, rules, flows, validation) — framework-agnostic
lib/            Client-side storage, analytics, settings, statistics, sound
providers/      Word-source providers (AI, custom word, fallback, cache) with fallback chain
assets/         Source images for app icon/splash (regenerated into android/ via capacitor-assets)
android/        Capacitor-generated native Android project
e2e/            Playwright end-to-end tests
test/           Vitest unit tests
scripts/        Build helper scripts (mobile build, service worker generation)
```

## Building for Android

```bash
npm run build:mobile
npx cap sync android
cd android
./gradlew bundleRelease      # gradlew.bat on Windows
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Release signing

Release builds are signed using `android/keystore.properties` (gitignored,
never commit it). If that file doesn't exist, the release build stays
unsigned and works fine for local testing — but an unsigned AAB **cannot**
be uploaded to Play Console.

To generate your upload key (one-time):

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore imposter-word-upload-key.jks \
  -alias imposter-word-key -keyalg RSA -keysize 2048 -validity 10000
```

Store the resulting `.jks` file outside version control (e.g.
`android/app/imposter-word-upload-key.jks`), then create
`android/keystore.properties`:

```properties
storeFile=app/imposter-word-upload-key.jks
storePassword=your_store_password
keyAlias=imposter-word-key
keyPassword=your_key_password
```

Back up the `.jks` file somewhere safe outside the repo — losing it means
you can never publish an update to the same Play Store listing again.

### Regenerating icons/splash

Source images live in `assets/` (`icon.png`, `splash.png`, `splash-dark.png`,
`feature-graphic.png`). After changing any of them:

```bash
npm run cap:assets:android
```

This regenerates every density-specific variant under `android/app/src/main/res/`.
Don't hand-edit those generated files directly.

## Testing

```bash
npm run test:run       # unit tests (Vitest)
npm run test:e2e:local # e2e tests (Playwright, Chromium)
```

`npm run release:local` runs the full gate (lint, type-check, unit tests, e2e
tests) before syncing and opening the Android project — run this before
cutting a release build.

## Privacy & data handling

- No account, no login, no personal data collection.
- Player names, settings, and statistics are stored locally on-device only.
- AI word/hint requests send only category, difficulty, and a short list of
  recently-used words to avoid — never player names or device identifiers.
- Full policy: `/privacy` (see `components/privacy/PrivacyPolicyScreen.tsx`).

## Deployment

The web app is deployed on Vercel. The Android build reads
`NEXT_PUBLIC_API_BASE_URL` (set in `.env.mobile`) to reach the deployed API
for word generation, since the native shell has no server of its own.

## License

Imposter Word Game is made by Syed Ahmed Ali.