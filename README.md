# Imposter Word — Home Screen (Screen 1)

Next.js 16 + React + TypeScript + Tailwind CSS v4.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the Home Screen is at `/`.

## What's here

- `app/page.tsx` -> renders `HomeScreen`
- `app/setup`, `app/how-to-play`, `app/settings`, `app/statistics` -> temporary
  placeholder pages so the Home Screen's navigation has somewhere to go.
  Replace these with the real screens later.
- `components/home/` -> all Home Screen components (header, logo/mascot,
  primary CTA, menu, offline/AI info card, footer, starfield background).

## Notes

- Fonts (Fredoka for display, Manrope for body) are self-hosted via
  `@fontsource`, so there's no external network request at runtime.
- The online/offline pill is a purely cosmetic indicator based on
  `navigator.onLine` -- it never blocks or gates the screen. Real
  connectivity/fallback logic belongs in the future Round Provider.
- No AI calls, no database, no auth -- this screen is fully self-contained
  and works with the network off.
