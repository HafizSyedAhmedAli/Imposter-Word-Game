# pages

One slice per route. Composes widgets/features into the full screen for that
route. The matching `app/<route>/page.tsx` stays a thin shell that imports
and renders the default export from here — no logic in `app/`.

Planned slices (not yet moved — see `../ARCHITECTURE.md`), one per current
`app/` route: `home`, `setup`, `players`, `round`, `pass`, `voting`,
`results`, `final-results`, `statistics`, `achievements`, `settings`,
`settings/custom-words`, `how-to-play`, `privacy`.

Import from other layers: `widgets/`, `features/`, `entities/`, `shared/`.
